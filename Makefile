####
#### Testing, benchmarking, and release procedures for BBOP-JS.
####
#### See README.org in this directory for more detail.
####
#### A report-mistakes-only testing ("fail"s?) run can be done as:
####  make test | grep -c -i fail; test $? -ne 0
####

TESTS = \
 $(wildcard lib/bbop/*.js.tests) \
 $(wildcard lib/bbop/model/*.js.tests) \
 $(wildcard lib/bbop/golr/*.js.tests) \
 $(wildcard lib/bbop/golr/manager/*.js.tests) \
 $(wildcard lib/bbop/rest/*.js.tests) \
 $(wildcard lib/bbop/rest/response/*.js.tests) \
 $(wildcard lib/bbop/rest/manager/*.js.tests) \
 $(wildcard lib/bbop/widget/display/*.js.tests) \
 $(wildcard lib/bbop/widget/*.js.tests) \
 ##
 ## $(wildcard lib/bbop/contrib/go/*.js.tests)
 ## $(wildcard lib/bbop/parse/*.js.tests) \
#BENCHMARKS = $(wildcard _benchmark/*.js)

## Test JS environment.
TEST_JS = rhino
## Some tests require things like "-opt -1" in some cases (big GO tests).
## rhino needs this for the big GO tree in model.tests.go.js.
## Java BUG, so interpretation is forced.
## See: http://coachwei.sys-con.com/node/676073/mobile
#TEST_JS_FLAGS = -modules staging/bbop.js -opt -1 -w -strict
TEST_JS_FLAGS = -modules staging/bbop.js -opt -1

## Other JS environments.
NODE_JS ?= /usr/bin/node
#NODE_JS ?= /home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
RHINO_JS ?= /usr/bin/rhino
RINGO_JS ?= /usr/bin/ringo
##
BBOP_JS_VERSION ?= 2.0.0-rc1

all:
	@echo "Using JS engine: $(TEST_JS)"
#	@echo "All JS engines: $(JSENGINES)"
	@echo "Tests defined: $(TESTS)"
	@echo "See README.org in the directory for more details."
#	@echo "Benchmarks defined: $(BENCHMARKS)"

###
### Tests.
###

.PHONY: test $(TESTS)
test: $(TESTS)
$(TESTS): bundle
	echo "trying: $@"
	$(TEST_JS) $(TEST_JS_FLAGS) -f $(@D)/$(@F)
#	cd $(@D) && $(TEST_JS) $(TEST_JS_FLAGS) -f $(@F)

###
### Just the exit code results of the tests.
###

.PHONY: pass
pass:
	make test | grep -i fail; test $$? -ne 0

###
### Documentation.
###

.PHONY: docs

docs:
	naturaldocs --rebuild-output --input lib/bbop/ --project docs/.naturaldocs_project/ --output html docs/
#	naturaldocs --rebuild-output --input lib/bbop/ --input bin/ --project docs/.naturaldocs_project/ --output html docs/

###
### Create exportable JS bundle.
###

.PHONY: bundle
bundle:
	./scripts/release-js.pl -v -i scripts/release-file-map.txt -o staging/bbop.js -n bbop -d lib/bbop -r $(BBOP_JS_VERSION)

###
### Create exportable JS bundle, but skip minifying.
###

.PHONY: bundle-uncompressed
bundle-uncompressed:
	./scripts/release-js.pl -v -u -i scripts/release-file-map.txt -o staging/bbop.js -n bbop -d lib/bbop -r $(BBOP_JS_VERSION)

###
### Release: docs and bundle; then to an upload.
###

.PHONY: release
release: bundle docs
	s3cmd -P put staging/bbop*.js s3://bbop/jsapi/
	s3cmd -P put demo/index.html s3://bbop/jsapi/bbop-js/demo/
	s3cmd -P put demo/golr.js s3://bbop/jsapi/bbop-js/demo/
	s3cmd --recursive -P put docs/ s3://bbop/jsapi/bbop-js/docs/

# ###
# ### Refresh some temporary developer stuff consistently.
# ### The main purpose right now is to provide some temporary testing
# ### for CommonJS support of BBOP.
# ###

# .PHONY: commonjs-test
# commonjs-test: bundle
# 	cp ./staging/bbop.js ./bin/bbop-commonjs.js
# 	echo "\n" >> ./bin/bbop-commonjs.js
# 	echo "exports.bbop = bbop;" >> ./bin/bbop-commonjs.js
# 	echo "\n" >> ./bin/bbop-commonjs.js

# ###
# ### Benchmarks.
# ###

# .PHONY: benchmark $(BENCHMARKS)

# benchmark: $(BENCHMARKS)

# $(BENCHMARKS):
# 	for e in $(JSENGINES); do \
#            echo "Trying engine: $$e"; \
#            $$e -f $@; \
#         done

###
### Start various environments the right way for experimentation.
### Should all be able to use CommonJS require in the expected way:
###   var bbop = require('bbop').bbop;
###   bbop.version.revision;
###

.PHONY: start-node
start-node:
	NODE_PATH="staging" $(NODE_JS) -i

.PHONY: start-rhino
start-rhino:
	$(RHINO_JS) -modules staging/bbop.js -f -

.PHONY: start-ringo
start-ringo:
	RINGO_MODULE_PATH="staging" $(RINGO_JS) -i
