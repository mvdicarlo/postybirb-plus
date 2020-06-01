set /a attempts=0

:Build
set /a attempts=%attempts%+1
if %attempts% GEQ 5 goto BuildFailure
call yarn run build
if %ERRORLEVEL% NEQ 0 goto Build

:PostBuild
echo Build succeeded with %attempts% attempts.
timeout 5
cd electron-app
call yarn run start
cd ..
exit


:BuildFailure
echo Build failed, exceeded 5 retries.
timeout 5
exit