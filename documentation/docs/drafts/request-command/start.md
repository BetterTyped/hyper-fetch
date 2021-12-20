Zawiera wszystko to co jest potrzebne do wykonania requestu.
-> Każda metoda zwraca "skopiowany" obiekt. 
Obiekt request-command nie jest mutowalny.

Można go użyć też aby:
  - podpiąć się do eventów reqestu:
    - onRequestProgress
    - onResponseProgress
    - onError
    - onSuccess
    - onFinish
    - onRequestStart

Pozwala także na cancellowanie requestów.