import pandas as pd


def changeIDs(file):
    count = 0
    df = pd.read_csv(file)
    encounter = df["Encounter_ID"]
    patient = df["Patient_ID"]

    for i in encounter:
        encounter.replace(i, count, inplace=True)
        count += 1

    listOfPatients = []
    for i in patient:
        if i not in listOfPatients:
            listOfPatients.append(i)

    dictOfPatients = {i: listOfPatients[i] for i in range(0, len(listOfPatients))}

    for i in patient:
        for key in dictOfPatients:
            if i == dictOfPatients[key]:
                patient.replace(i, listOfPatients.index(i), inplace=True)

    df.to_csv(file, index=False)


def splitFile(file):
    df = pd.read_csv(file)
    in1 = df.iloc[0:(len(df)//3)]
    in2 = df.iloc[(len(df)//3):(2 * len(df)//3)]
    in3 = df.iloc[(2 * len(df)//3):]
    in1.to_csv("in1.csv", index=False)
    in2.to_csv("in2.csv", index=False)
    in3.to_csv("in3.csv", index=False)


def main():
    file = "testDB1.csv"
    changeIDs(file)
    splitFile(file)


if __name__ == "__main__":
    main()
