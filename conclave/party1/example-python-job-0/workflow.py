from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in1 = read_rel('/home/seed/conclave/party1/in1.csv')
    aggregation_0 = aggregate_count(in1, 1)
    write_rel('/home/seed/conclave/party1', 'aggregation_0.csv', aggregation_0, '"Patient_ID","by_patient_id"')

    print("done python")
