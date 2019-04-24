INSTALL_DIR=$(TARGET_DIR)/websrv
all: todo-srv

check_env:
	@if [ "$(TARGET_DIR)" = "" ]; then echo "ERROR: TARGET_DIR was not set"; exit 1; fi
	@if [ "$(TAG_VERSION)" = "" ]; then echo "ERROR: TAG_VERSION was not set"; exit 1; fi
	@if [ "$(REGISTRY)" = "" ]; then echo "ERROR: REGISTRY was not set"; exit 1; fi

todo-srv:check_env
	test -e node_modules || npm install
	test -e typings || typings install
	tsc

install:check_env
	rm -rf $(INSTALL_DIR)
	mkdir -p $(INSTALL_DIR)
	cp -r build node_modules public logs package.json cert $(INSTALL_DIR)/

.PHONY: clean cleanall
clean:
	rm -rf build

cleanall:
	rm -rf node_modules typings build

