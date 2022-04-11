from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in2 = read_rel('/home/seed/conclave/party2/in2.csv')
    test_1 = aggregate_count(in2, 1)
    write_rel('/home/seed/conclave/party2', 'test_1.csv', test_1, '"Patient_ID","by_patient_id"')

    print("done python")
