from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in3 = read_rel('/home/seed/conclave/party3/in3.csv')
    aggregation_2 = aggregate_count(in3, 1)
    write_rel('/home/seed/conclave/party3', 'aggregation_2.csv', aggregation_2, '"Patient_ID","by_patient_id"')

    print("done python")
