from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in1 = read_rel('/home/seed/conclave/party1/in1.csv')
    heatmap_0 = aggregate_count(in1, 1)
    write_rel('/home/seed/conclave/party1', 'heatmap_0.csv', heatmap_0, '"location","by_location"')

    print("done python")
