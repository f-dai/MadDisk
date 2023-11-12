#include <iostream>
#include <vector>
#include <stdlib.h>
using namespace std;

class SSTF {
    private:
        vector<int> sstf;
        int pointer = 0;
    public:
        void add(int input) {
            sstf.push_back(input);
            return;
        }
        int get(void) {
            int index = -1;
            int min_distance = 21470000;
            if(!sstf.empty()) {
                for(int i = 0; i < sstf.size(); i++) {
                    if(i != pointer) {
                        int distance = sstf.at(i) - sstf.at(pointer);
                        if(distance < min_distance) {
                            min_distance = distance;
                            index = i;
                            pointer = i;
                        }
                    }
                }
            }
            else {
                return -1;
            }
            return index;
        }
};

class scan {
    private:
        int array[32];
        int dir = 1;
        int pointer = 0;
    public:
        void init() {
            for(int i = 0; i < 32; i++) {
                array[i] = 0;
            }
            dir = 1;
            pointer = 0;
        }
        bool isEmpty() {
            for(int i = 0; i < 32; i++) {
                if(array[i] != 0) return true;
            }
            return false;
        }
        int add(int input) {
            array[input] = 1;
        }
        int get() {
            if(isEmpty) return -1;
            while(1) {
                if(dir == 1) {
                    for(; pointer < 32 ;pointer++) {
                        if(array[pointer] == 1) {
                            array[pointer] = 0;
                            return pointer;
                        }
                    }
                    pointer--; 
                    dir = 0;
                }
                if(dir == 0) {
                    for(; pointer >= 0 ; pointer--) {
                        if(array[pointer] == 1) {
                            array[pointer] = 0;
                            return pointer;
                        }
                    }
                    pointer++;
                    dir = 1;
                }
            }
            return -1;
        }

};



int main(void) {
    cout<<"mad madhacker\n";

    return 0;
}
