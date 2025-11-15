.PHONY: all clean move

OUT = build/minmax.js
SRC = minmax.cpp

all: $(OUT) move

$(OUT): $(SRC) Makefile
	mkdir -p build
	em++ ${SRC} -O3 \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME='createMinMaxModule' \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s INITIAL_MEMORY=16MB \
	-s EXPORTED_FUNCTIONS='["_best_move","_malloc","_free"]' \
	-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","setValue","HEAP8","HEAP32","HEAPU8","wasmMemory"]' \
	-o $(OUT)

move:
	mkdir -p ../public/wasm
	cp build/minmax.js ../public/wasm/minmax.js
	cp build/minmax.wasm ../public/wasm/minmax.wasm

clean:
	rm -rf build
