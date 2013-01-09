####
#### Testing, benchmarking, and release procedures for BBOP-JS.
####
#### See README.org in this directory for more detail.
####
#### A report-mistakes-only testing ("fail"s?) run can be done as:
####  make test | grep -c -i fail; test $? -ne 0
####

TESTS = $(wildcard lib/*.js.tests) \
 $(wildcard lib/bbop/*.js.tests) \
 $(wildcard lib/bbop/contrib/*.js.tests) \
 $(wildcard lib/bbop/golr/*.js.tests) \
 $(wildcard lib/bbop/golr/manager/*.js.tests) \
 $(wildcard lib/bbop/parse/*.js.tests) \
 $(wildcard lib/bbop/model/*.js.tests) \
 $(wildcard lib/bbop/widget/*.js.tests) \
 $(wildcard lib/bbop/widget/display/*.js.tests) \
 $(wildcard lib/bbop/contrib/go/*.js.tests)
#BENCHMARKS = $(wildcard _benchmark/*.js)
JS = rhino #smjs or rhino, etc.
## Some require things like "-opt -1" in some cases (big GO tests)
JSFLAGS = -opt -1 -w -strict # rhino needs this for the big GO tree
#JSENGINES = node smjs rhino

all:
	@echo "Using JS engine: $(JS)"
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
	cd $(@D) && $(JS) $(JSFLAGS) -f $(@F)

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
	./scripts/release-js.pl -v -i scripts/release-file-map.txt -o staging/bbop.js -n bbop -d lib/bbop -r 0.9

###
### Create exportable JS bundle, but skip minifying.
###

.PHONY: bundle-uncompressed

bundle-uncompressed:
	./scripts/release-js.pl -v -u -i scripts/release-file-map.txt -o staging/bbop.js -n bbop -d lib/bbop -r 0.9

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
# ### Benchmarks.
# ###

# .PHONY: benchmark $(BENCHMARKS)

# benchmark: $(BENCHMARKS)

# $(BENCHMARKS):
# 	for e in $(JSENGINES); do \
#            echo "Trying engine: $$e"; \
#            $$e -f $@; \
#         done
