#!/bin/bash

firebase emulators:exec "jest --watchAll --maxWorkers=1 --detectOpenHandles --forceExit $*"
