Miejsce, które populuje dane wejściowe dla wszelakich hooków. Wszystko co dotyczy cache dzieje się przez customowe
eventy. Cache dzieje się automatycznie. <- można setować przy tworzeniu buildera

// TODO test + sprawdzenie ile pamięci zjada cache 1000 lub 5000 stron po N obiektów i pól. // TODO persisting cache

- poprawić mutowanie bo będzie dramat
- usunąć - refresh error i retry error, retries - po otrzymaniu nowych danych z requesta + test
- możliwość podpięcia własnego cache (wtedy można zrobić persist data) i traktować to jako offline - persist store
- główny klucz musi mieć param wypełniony
- test retry + retry error
- test refresh error
- test jak się zachowuje refresh error i retry -error w momencie gdy jakieś poprawne dane są w cache

- persist / offline

- pagination
- cache namespaces
