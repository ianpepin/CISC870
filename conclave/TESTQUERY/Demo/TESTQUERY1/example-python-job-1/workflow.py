from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in2 = read_rel('/home/seed/conclave/party1/in2.csv')
    heatmap_1 = aggregate_count(in2, 1)
    write_rel('/home/seed/conclave/party1', 'heatmap_1.csv', heatmap_1, '"location","by_location"')

    print("done python")
