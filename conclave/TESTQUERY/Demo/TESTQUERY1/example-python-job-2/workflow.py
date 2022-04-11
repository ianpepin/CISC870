from conclave.codegen.libs.python import *

if __name__ == "__main__":
    print("start python")
    in3 = read_rel('/home/seed/conclave/party1/in3.csv')
    heatmap_2 = aggregate_count(in3, 1)
    write_rel('/home/seed/conclave/party1', 'heatmap_2.csv', heatmap_2, '"location","by_location"')

    print("done python")
