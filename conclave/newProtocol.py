import sys
import json
from conclave.lang import *
from conclave.utils import *
from conclave import workflow


def protocol():

	cols_in_one = [
		defCol("Encounter_ID", "INTEGER", [1]),
		defCol("Patient_ID", "INTEGER", [1])
	]
	in_one = create("in1", cols_in_one, {1})

	cols_in_two = [
		defCol("Encounter_ID", "INTEGER", [2]),
		defCol("Patient_ID", "INTEGER", [2])
	]
	in_two = create("in2", cols_in_two, {2})

	cols_in_three = [
		defCol("Encounter_ID", "INTEGER", [3]),
		defCol("Patient_ID", "INTEGER", [3])
	]
	in_three = create("in3", cols_in_three, {3})

	#combined = concat([in_one, in_two, in_three], "combined_data")
	#agged = aggregate_count(combined, "test", ["location"], "by_location")
	join1 = join(in_one, in_two, "join1", ["Patient_ID"], ["Patient_ID"])
	join2 = join(join1, in_three, "join2", ["Patient_ID"], ["Patient_ID"])
	collect(join2, 1)

	return {in_one, in_two, in_three}


if __name__ == "__main__":

	with open(sys.argv[1], "r") as c:
		c = json.load(c)

	workflow.run(protocol, c, mpc_framework="jiff", apply_optimisations=True)
