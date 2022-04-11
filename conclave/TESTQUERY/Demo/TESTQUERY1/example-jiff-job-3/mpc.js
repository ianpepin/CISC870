(function(exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    opt.crypto_provider = true;

    if(node)
    {
        JIFFClient = require('/home/seed/conclave/jiff/lib/jiff-client');
        jiff_bignumber = require('/home/seed/conclave/jiff/lib/ext/jiff-client-bignumber');
        //jiff_fixedpoint = require('/home/seed/conclave/jiff/lib/ext/jiff-client-fixedpoint');
        //jiff_negativeNumber = require('/home/seed/conclave/jiff/lib/ext/jiff-client-negativenumber');
    }

    opt.autoConnect = false;
    saved_instance = new JIFFClient(hostname, computation_id, opt);
    saved_instance.apply_extension(jiff_bignumber, opt);
    //saved_instance.apply_extension(jiff_fixedpoint, opt);
    //saved_instance.apply_extension(jiff_negativeNumber, opt);
    saved_instance.connect();

    return saved_instance;
  };


const project = function(inRel, keepRows, projCols)
  {

    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < inRel.length; i++)
    {
      ret.push([]);
      keepRowsResult.push(keepRows[i]);
      for (var j = 0; j < projCols.length; j++)
      {
        ret[i].push(inRel[i][projCols[j]]);
      }
    }
    return [ret, keepRowsResult];
  };

const join = function(leftRel, rightRel, leftKeepRows, rightKeepRows, leftJoinColIdx, rightJoinColIdx)
  {

    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < leftRel.length; i++)
    {
      for (var j = 0; j < rightRel.length; j++)
      {
        var leftJoinCol = leftRel[i][leftJoinColIdx];
        var rightJoinCol = rightRel[j][rightJoinColIdx];

        var newLeft = leftRel[i].slice();
        var newRight = rightRel[j].slice();
        newLeft.splice(leftJoinColIdx, 1);
        newRight.splice(rightJoinColIdx, 1);
        var newRow = [leftJoinCol].concat(newLeft).concat(newRight);
        ret.push(newRow);

        var eqFlag = leftJoinCol.seq(rightJoinCol);
        var keepRowsFlag = leftKeepRows[i].smult(rightKeepRows[j]).smult(eqFlag);
        keepRowsResult.push(keepRowsFlag);
      }
    }

    return [ret, keepRowsResult];
  };

const multiply = function(inRel, keepRows, newCol, targetCol, operands, scalar)
  {
    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < inRel.length; i++)
    {
      keepRowsResult.push(keepRows[i]);
      var targetVal = inRel[i][targetCol].cmult(scalar);
      for (var j = 0; j < operands.length; j++)
      {
        targetVal = targetVal.smult(inRel[i][operands[j]]);
      }
      if (newCol)
      {
        var newRow = inRel[i].concat([targetVal]);
        ret.push(newRow);
      }
      else
      {
        inRel[i][targetCol] = targetVal;
        ret.push(inRel[i]);
      }
    }

    return [ret, keepRowsResult];
  };

const multiplyMatrices = function(leftRel, rightRel, leftKeepRows, rightKeepRows)
  {
    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < leftRel.length; i++)
    {
        keepRowsResult.push(leftKeepRows[i].smult(rightKeepRows[i]));
        tempArray = [];

        for (var j = 0; j < leftRel[i].length; j++)
        {
            tempArray.push(leftRel[i][j].smult(rightRel[i][j]))
        }
        ret.push(tempArray);
    }

    return [ret, keepRowsResult];

  };

const divide = function(inRel, keepRows, newCol, targetCol, operands, scalar)
  {
    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < inRel.length; i++)
    {
      keepRowsResult.push(keepRows[i]);
      var targetVal = inRel[i][targetCol].cdiv(scalar);
      for (var j = 0; j < operands.length; j++)
      {
        targetVal = targetVal.sdiv(inRel[i][operands[j]]);
      }
      if (newCol)
      {
        var newRow = inRel[i].concat([targetVal]);
        ret.push(newRow);
      }
      else
      {
        inRel[i][targetCol] = targetVal;
        ret.push(inRel[i]);
      }
    }

    return [ret, keepRowsResult];
  }

const concatenate = function(inRels, keepRows)
  {
    var ret = [];
    var keepRowsResult = [];

    for (var i = 0; i < inRels.length; i++)
    {
      for (var j = 0; j < inRels[i].length; j++)
      {
        console.log(inRels[i][j]);
        ret.push(inRels[i][j]);
        keepRowsResult.push(keepRows[i][j]);
      }
    }

    return [ret, keepRowsResult];
  };

const nextPowerOfTwo = function(n)
{
  var p = 1;
  if (n && !(n & (n-1)))
  {
    return n;
  }

  while (p < n)
  {
    p <<=1;
  }

  return p;
}

const compareExchange = function(inRel, keepRows, keyCol, numCols, i, j)
{
  if (j >= inRel.length || i >= inRel.length)
  {
    return;
  }

  var x = inRel[i][keyCol];
  var y = inRel[j][keyCol];

  var cmp = x.lt(y);

  for (var k = 0; k < numCols; k++)
  {
    var tempOne = cmp.if_else(inRel[i][k], inRel[j][k]);
    var tempTwo = cmp.if_else(inRel[j][k], inRel[i][k]);

    inRel[i][k] = tempOne;
    inRel[j][k] = tempTwo;
  }

  var tempKeepOne = cmp.if_else(keepRows[i], keepRows[j]);
  var tempKeepTwo = cmp.if_else(keepRows[j], keepRows[i]);

  keepRows[i] = tempKeepOne;
  keepRows[j] = tempKeepTwo;
}

const compareExchangeBatched = async function(inRel, keepRows, jiff_instance, keyCol, numCols, minVal, maxVal, m, r)
{
  var loop = jiff_instance.start_barrier();
  for (var i = minVal; i < maxVal; i+=m)
  {
    compareExchange(inRel, keepRows, keyCol, numCols, i, i+r);
  }
  await jiff_instance.end_barrier(loop);
}

const oddEvenMerge = async function(inRel, keepRows, jiff_instance, keyCol, numCols, lo, n, r)
{
  var m = r * 2;
  if (m < n)
  {
    await oddEvenMerge(inRel, keepRows, jiff_instance, keyCol, numCols, lo, n, m);
    await oddEvenMerge(inRel, keepRows, jiff_instance, keyCol, numCols, lo+r, n, m);

    var start = lo+r;
    var end = lo+n-r;
    var steps = Math.floor((end-start)/m);

    var chunks = Math.floor(steps/20);

    if (chunks > 0)
    {
      for (var i = 0; i < chunks; i++)
      {
        minVal = start + (i*20)*m;
        maxVal = minVal + (20*m);
        await compareExchangeBatched(inRel, keepRows, jiff_instance, keyCol, numCols, minVal, maxVal, m, r);
      }
      // finish last bit
      await compareExchangeBatched(inRel, keepRows, jiff_instance, keyCol, numCols, maxVal, end, m, r);
    }
    else
    {
      await compareExchangeBatched(inRel, keepRows, jiff_instance, keyCol, numCols, start, end, m ,r);
    }
  }
  else
  {
    compareExchange(inRel, keepRows, keyCol, numCols, lo, lo+r);
  }
}

const _oddEvenSort = async function(inRel, keepRows, jiff_instance, keyCol, numCols, lo, n)
{
  if (n > 1)
  {
    var m = Math.floor(n/2);
    await _oddEvenSort(inRel, keepRows, jiff_instance, keyCol, numCols, lo, m);
    await _oddEvenSort(inRel, keepRows, jiff_instance, keyCol, numCols, lo+m, m);
    await oddEvenMerge(inRel, keepRows, jiff_instance, keyCol, numCols, lo, n, 1);
  }
}

const oddEvenSort = async function(inRel, keepRows, jiff_instance, keyCol)
{
  var numCols = inRel[0].length;
  var nextPowTwo = nextPowerOfTwo(inRel.length);
  await _oddEvenSort(inRel, keepRows, jiff_instance, keyCol, numCols, 0, nextPowTwo);
}

const _bubbleSort = async function(inRel, keepRows, keyCol, jiff_instance, numCols, minVal, maxVal)
{
  var loop = jiff_instance.start_barrier();
  for (var i = minVal; i < maxVal; i++)
  {
    var a = inRel[i][keyCol];
    var b = inRel[i+1][keyCol];
    var cmp = a.slt(b);

    for (var j = 0; j < numCols; j++)
    {
      var tempOne = cmp.if_else(inRel[i][j], inRel[i+1][j]);
      var tempTwo = cmp.if_else(inRel[i+1][j], inRel[i][j]);

      inRel[i][j] = tempOne;
      inRel[i+1][j] = tempTwo;
    }

    var keepOne = cmp.if_else(keepRows[i], keepRows[i+1]);
    var keepTwo = cmp.if_else(keepRows[i+1], keepRows[i]);

    keepRows[i] = keepOne;
    keepRows[i+1] = keepTwo;
  }
  await jiff_instance.end_barrier(loop);
}

const bubbleSort = async function(inRel, keepRows, keyCol, jiff_instance)
{
  console.log("\n\nIN SORT\n\n");
  var numCols = inRel[0].length;

  for (var i = 0; i < inRel.length; i++)
  {
    console.log(i);
    var minVal;
    var maxVal;

    var totalRows = inRel.length - i - 1;
    var chunks = Math.floor(totalRows/20);
    if (chunks > 0)
    {
      for (var j = 0; j < chunks; j++)
      {
        console.log(j);
        minVal = 20 * j;
        maxVal = minVal + 20;
        await _bubbleSort(inRel, keepRows, keyCol, jiff_instance, numCols, minVal, maxVal);
      }
      // finish last bit
      await _bubbleSort(inRel, keepRows, keyCol, jiff_instance, numCols, maxVal, totalRows);
    }
    else
    {
      await _bubbleSort(inRel, keepRows, keyCol, jiff_instance, numCols, 0, totalRows);
    }
  }
  console.log("\n\nLEAVING SORT\n\n");
  return [inRel, keepRows];
}

const aggregate = async function(inRel, keepRows, keyCol, aggCol, jiff_instance)
  {
    var newRel = []

    for (var i = 0; i < inRel.length; i++)
    {
      newRel.push([]);
      newRel[i].push(inRel[i][keyCol]);
      newRel[i].push(inRel[i][aggCol]);
    }

    var sorted = await bubbleSort(newRel, keepRows, 0, jiff_instance);
    var sortedData = sorted[0];
    var sortedKeepRows = sorted[1];

    for (var i = 0; i < sortedData.length - 1; i++)
    {
      jiff_instance.start_barrier();

      var a = sortedData[i][0];
      var b = sortedData[i+1][0];
      var dataCmp = a.eq(b);

      // if both keyCols are equal, add the aggCols together
      // Else, don't touch aggCol at i+1
      var temp = dataCmp.if_else(sortedData[i][1].sadd(sortedData[i+1][1]), sortedData[i+1][1]);

      // indicates whether both keepRows equal 1
      var bothKeep = sortedKeepRows[i].smult(sortedKeepRows[i+1]);

      // indicates whether both keyCols are equal AND both keepRows == 1
      var dataKeepFlag = dataCmp.smult(bothKeep);

      // if both keepRows are 1, then store the added values in sortedData[i+1][1]
      var tempResult = bothKeep.if_else(temp, sortedData[i+1][1]);

      // if both rows have matching keyCols AND both keepRows == 1, make keepRows[i] == 0
      // Else, don't touch it
      var tempKeep = dataKeepFlag.if_else(0, keepRows[i]);

      sortedData[i+1][1] = tempResult;
      sortedKeepRows[i] = tempKeep;

      await jiff_instance.end_barrier();
    }

    return [sortedData, sortedKeepRows];
  }

const aggregateMean = async function(inRel, keepRows, keyCol, aggCol, preSorted, jiff_instance)
{
    var newRel = [];
    var newKeepRows = [];
    var counts = [];

    for (var i = 0; i < inRel.length; i++)
    {
      newRel.push([]);
      newRel[i].push(inRel[i][keyCol]);
      newRel[i].push(inRel[i][aggCol]);

      newKeepRows.push(keepRows[i]);

      counts.push(1);
    }

    if (!preSorted)
    {
      var sorted = await bubbleSort(newRel, newKeepRows, 0, jiff_instance);
      var sortedData = sorted[0];
      var sortedKeepRows = sorted[1];
    }
    else
    {
      var sortedData = newRel;
      var sortedKeepRows = newKeepRows;
    }

    // total awful hack wow
    var tmpInitVal = newKeepRows[0];
    counts[0] = tmpInitVal.if_else(tmpInitVal, tmpInitVal.add(1));

    for (var i = 0; i < sortedData.length - 1; i++)
    {
      var a = sortedData[i][0];
      var b = sortedData[i+1][0];
      var dataCmp = a.eq(b);

      var temp = dataCmp.if_else(sortedData[i][1].add(sortedData[i+1][1]), sortedData[i+1][1]);
      var bothKeep = sortedKeepRows[i].mult(sortedKeepRows[i+1]);
      var dataKeepFlag = dataCmp.mult(bothKeep);
      var tempResult = bothKeep.if_else(temp, sortedData[i+1][1]);
      var tempKeep = dataKeepFlag.if_else(0, keepRows[i]);
      var tempCount = dataKeepFlag.if_else(counts[i].add(1), 1);

      sortedData[i+1][1] = tempResult;
      sortedKeepRows[i] = tempKeep;
      counts[i+1] = tempCount;

    }

    for (var i = 0; i < sortedData.length; i++)
    {
      var temp = sortedData[i][1].div(counts[i]);
      sortedData[i][1] = temp;
    }

    return [sortedData, sortedKeepRows];
}

const _aggregateMeanWithCountCol = async function(sortedData, sortedKeepRows, jiff_instance, minVal, maxVal)
{
  var loop = jiff_instance.start_barrier();
  for (var i = minVal; i < maxVal; i++)
  {
    var a = sortedData[i][0];
    var b = sortedData[i+1][0];
    var dataCmp = a.eq(b);

    var temp = dataCmp.if_else(sortedData[i][1].add(sortedData[i+1][1]), sortedData[i+1][1]);
    var bothKeep = sortedKeepRows[i].mult(sortedKeepRows[i+1]);
    var dataKeepFlag = dataCmp.mult(bothKeep);
    var tempResult = bothKeep.if_else(temp, sortedData[i+1][1]);
    var tempKeep = dataKeepFlag.if_else(0, sortedKeepRows[i]);
    var tempCount = dataKeepFlag.if_else(sortedData[i][2].add(sortedData[i+1][2]), sortedData[i+1][2]);

    sortedData[i+1][1] = tempResult;
    sortedKeepRows[i] = tempKeep;
    sortedData[i+1][2] = tempCount;
  }
  await jiff_instance.end_barrier(loop);
}

const _aggDivHelper = async function(sortedData, ret, jiff_instance, minVal, maxVal)
{
  var loop = jiff_instance.start_barrier();
  for (var i = minVal; i < maxVal; i++)
  {
    var temp = sortedData[i][1].div(sortedData[i][2]);
    ret.push([sortedData[i][0], temp]);
  }
  await jiff_instance.end_barrier(loop);
}

const aggregateMeanWithCountCol = async function(inRel, keepRows, keyCol, aggCol, countCol, preSorted, jiff_instance)
{
    var newRel = [];
    var newKeepRows = [];
    var counts = [];
    var minVal;
    var maxVal;

    for (var i = 0; i < inRel.length; i++)
    {
      newRel.push([]);
      newRel[i].push(inRel[i][keyCol]);
      newRel[i].push(inRel[i][aggCol]);
      newRel[i].push(inRel[i][countCol]);

      newKeepRows.push(keepRows[i]);
    }

    if (!preSorted)
    {
      console.log("SORTING");
      await oddEvenSort(newRel, newKeepRows, jiff_instance, 0);
      console.log("SORTING DONE");
    }

    var sortedData = newRel;
    var sortedKeepRows = newKeepRows;

    var totalRows = sortedData.length - 1;
    var chunks = Math.floor(totalRows/20);
    console.log("AGG: ");
    if (chunks > 0)
    {
      for (var cc = 0; cc < chunks; cc++)
      {
        minVal = cc * 20;
        maxVal = minVal + 20;
        console.log(cc);
        await _aggregateMeanWithCountCol(sortedData, sortedKeepRows, jiff_instance, minVal, maxVal);
      }
      // finish last bit
      await _aggregateMeanWithCountCol(sortedData, sortedKeepRows, jiff_instance, maxVal, totalRows);
    }
    else
    {
      await _aggregateMeanWithCountCol(sortedData, sortedKeepRows, jiff_instance, 0, totalRows);
    }

    var ret = [];
    var totalRows = sortedData.length;
    var chunks = Math.floor(totalRows/20);

    console.log("DIV: ");
    if (chunks > 0)
    {
      for (var cc = 0; cc < chunks; cc++)
      {
        console.log(cc);
        minVal = 20 * cc;
        maxVal = minVal + 20;
        await _aggDivHelper(sortedData, ret, jiff_instance, minVal, maxVal);
      }
      // finish last bit
      await _aggDivHelper(sortedData, ret, jiff_instance, maxVal, totalRows);
    }
    else
    {
      await _aggDivHelper(sortedData, ret, jiff_instance, 0, totalRows);
    }

    return [ret, sortedKeepRows];
}

const stdDev = async function(inRel, keepRows, keyCol, aggCol, jiff_instance)
{
  var newRel = [];

  for (var i = 0; i < inRel.length; i++)
  {
    newRel.push([]);
    newRel[i].push(inRel[i][keyCol]);
    newRel[i].push(inRel[i][aggCol]);
  }

  var sorted = await bubbleSort(newRel, keepRows, 0, jiff_instance);
  var sortedData = sorted[0];
  var sortedKeepRows = sorted[1];

  var mean = aggregateMean(sortedData, sortedKeepRows, 0, 1, 1);
  var meanData = mean[0];
  var meanKeepRows = mean[1];

  for (var i = 0; i < sortedData.length; i++)
  {
    var a = sortedData[i][0];

    for (var j = 0; j < meanData.length; j++)
    {
      var b = meanData[j][0];
      var dataCmp = a.eq(b);
      var temp = dataCmp.if_else(meanData[j][1], 0);
      // TODO: fix code underneath this is a hack for memory stuff
      // var bothKeep = sortedKeepRows[i].mult(meanKeepRows[j]);
      var subResult = temp.mult(meanKeepRows[j]);

      sortedData[i][1] = sortedData[i][1].sub(subResult);
    }

    var tempVal = sortedData[i][1];
    // square result
    sortedData[i][1] = tempVal.mult(tempVal);
  }

  var ret = aggregateMean(sortedData, sortedKeepRows, 0, 1, 1);
  var retData = ret[0];
  var retKeepRows = ret[1];

  return [retData, retKeepRows];
}

  const open = function(inRel, keepRows)
  {
    var results = saved_instance.open_ND_array(inRel);
    var keepRowsResults = saved_instance.open_array(keepRows);

    return Promise.all([results, keepRowsResults]).then(function(arr){
      var openedRes = arr[0];
      var openedKeep = arr[1];
      var ret = [];

      for (var i = 0; i < openedRes.length; i++)
      {
        if (openedKeep[i].toNumber())
        {
          ret.push(openedRes[i]);
        }
      }

      return ret;
    });
  };

  /**
   * The MPC computation
   */
  exports.compute = function (input, jiff_instance) {
    if(jiff_instance == null) jiff_instance = saved_instance;

    var fs = require('fs');

    // NOTE: assuming 1 file per party here

    var inputData = [];
    var keepRows = [];
    var unparsedData = (fs.readFileSync(input, 'UTF-8')).trim();
    var rows = unparsedData.split('\n');

    // start at one, skip header row
    for (let i = 1; i < rows.length; i++)
    {
      let arr = rows[i].split(',').map(Number);
      inputData.push(arr);
      keepRows.push(1);
    }

    var dataShares = jiff_instance.share_ND_array(inputData);
    var keepRowShares = jiff_instance.share_array(keepRows);

    var computation = Promise.all([dataShares, keepRowShares]).then(async function(arr) {
        
        var heatmap_0_close = arr[0][1];
        var heatmap_0_closeKeepRows = arr[1][1];

        var heatmap_1_close = arr[0][2];
        var heatmap_1_closeKeepRows = arr[1][2];

        var heatmap_2_close = arr[0][3];
        var heatmap_2_closeKeepRows = arr[1][3];

        var combined_dataRESULT = concatenate([heatmap_0_close,heatmap_1_close,heatmap_2_close], [heatmap_0_closeKeepRows,heatmap_1_closeKeepRows,heatmap_2_closeKeepRows]);
        var combined_data = combined_dataRESULT[0];
        var combined_dataKeepRows = combined_dataRESULT[1];

        var heatmap_oblRESULT = await aggregate(combined_data, combined_dataKeepRows, 0, 1, jiff_instance);
        var heatmap_obl = heatmap_oblRESULT[0];
        var heatmap_oblKeepRows = heatmap_oblRESULT[1];

        var heatmap_obl_open = open(heatmap_obl, heatmap_oblKeepRows);

        return heatmap_obl_open;

    });

    return computation.then(function(opened) {
        return opened;
    });
  };
}((typeof exports == 'undefined' ? this.mpc = {} : exports), typeof exports != 'undefined'));
