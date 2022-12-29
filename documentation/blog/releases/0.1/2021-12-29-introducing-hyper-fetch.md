---
slug: introducing-hyper-fetch
title: Introducing Hyper Fetch
authors: [maciej]
tags: [Release]
date: 2021-12-29
---

## Welcome! 👋

We are very happy to introduce [Hyper Fetch](https://github.com/BetterTyped/hyper-fetch) tool that helps to interact
with requests on the frontend side. We start from alpha stage as we believe that our ideas with the community
involvement may resolve with the best fetching tool out there.

The idea for Hyper Fetch was shaped over the years of work on many projects in which I encountered various problems in
the subject of fetching, request queueing, persistence, offline and data caching. This project was created to solve most
of them, and the most problematic or seemingly inaccessible - due to the level of complexity.

<!--truncate-->

## What is Hyper Fetch?

Hyper Fetch is a response to the needs related to all types of interaction with the server and maintaining high
maintainability thanks to architectural patterns. You don't need fetch or axios to use our library, but if you want to -
just do it! Creation of logic based on class patterns crystallized from my observations about the requests interactions
in systems that need offline or even persistent cache and request queues. It was obvious for me to keep the logic around
classes for those purposes but it also suited my philosophy of writing interceptors in tests, where the functional
approach requires copying part of the setup or extracting it significantly around files. As one of the lazy type of
developers, the most pleasant thing was to write a class based shared setup, where the tester or developer could connect
to such a client or a specific request, thanks to which he based everything on the current setup running in the
application. Thanks to this approach, the tests were more maintainable, any changes in the structure were visible
immediately thanks to typescript and the smaller config values were updated automatically, e.g. adding change to the
name of the endpoint did not have to be corrected in the tests because it uses actual app setup. It is simply a
convenient approach that allows you to focus on specific problems and develop the structure of the application through
any plugins, utilities or other helpers that can be easily added and solve our problems. Most modules can be replaced
with some custom logic additions, so choose whatever setup suits you - be it rest or graphql. With this library we
respond to problems such as structure for interaction with the server, offline support, queue of requests coming out one
by one, all at once or only the last one added during the shipment. We also try to solve issues such as persistent
queues, where the user can turn off the application with requests ready to be sent, turn it on again and be able to send
them. We are going to connect the native world and the web here, regardless of the js framework - but to be honest, we
will focus mainly on react, when it comes to angular, vue etc - in this case we will rely on the help of the community.
Speaking of the community - our approach to building this library should allow us to create a very wide number of
plugins and extensions - we are very open to help in testing and development, but all software design decisions must be
approved by the creators, especially at the beginning of the road, where testing and it may take us a while to cover
everything with testing.

## Client

Client is a class thanks to which we can control the entire process of interaction with the server. This is where all
request sending queues, cache and other modules necessary for operation, such as the http adapter, are initialized. Its
main purpose is to set up one place where we prepare our connection, first of all establishing the base url of our
server. With the setup client behind us, we can create new instances of requests that will be able to use the prepared
setup and derive information from it.

## Request

Request is an interaction with a given endpoint. During initialization, we set the path, method and a whole range of
interesting options such as cache time, retries count etc. It keeps the configuration needed to execute the request or
to dump it and save in queue storage to wait for its turn. The biggest advantage of Request is simplicity and the
ability to quickly set the entire configuration - only one option is required - the endpoint(method is defaulted to
GET).

## Queues, Cache, Persistence and Offline

One of the more difficult problems we deal with are queues and cache with simultaneous support for persistence. These
problems are very massive, so they will definitely mature for a while until 1.0.0 is released. However, it is not
something that cannot be solved, therefore, thanks to the command pattern, we are able to store requests dump and then
recreate it in the next sessions (with some restrictions in the persistence mode). By default persistence is disabled as
it requires connecting the data storage of your choice for it (by default we store data in Map object).

We have created two queues for sending requests - one for fetching, the other for submitting. This makes it easier to
manage their development, as the way they work in some cases can be completely different - just as we don't have to want
to create a persistent queue for all requests but only for those triggered by methods or React hooks to submit.

As for the cache, just like in the queues, we are able to create a persistent one. It currently works on namespeces -
this means that requests are grouped by default (this can be changed) around a namespace created from the given endpoint
and a method merged into one. Inside such a namespace, we keep requests made with various query params - so we cache
pagination data and those filtered with their use together with their time of saving. Thanks to that most of the caching
issues are handled by us, and access to namespace facilitates interaction with groups of the same requests - such as
mutations in optimistic ui approach. However, the idea with namespaces will be observed and tested in the near future,
so it may change, as well as a large part of the other features.

## Summary

This is not our last word, and many, many more will come in the course of the year. However, many of the problems
resolved here require time and observation, so we encourage you to help and share ideas - add an issue in the Hyper
Fetch repository. Help us to grow and to build the best fetching ecosystem out there. Soon we will start to add
documentation along with examples to get you into our vision of how modern fetching library should work and look!

:::danger

The library starts with **ALPHA** version please have it in mind when using it, since it's still not tested as we would
like. Currently we do not recommend using it in production as it's api may change due to the challenges we may stomp
upon.

:::
