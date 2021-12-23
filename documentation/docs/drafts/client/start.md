Default client for react fetch -> custom build on XHR:

- manageable progress:
- allows to ETA of request and response
- easy way to abort an ongoing request and response
- access to request events that are handled inside command.

! If there is no XHR in the window object or the XHR object is a polyfil in your environment, you have to install a
package
