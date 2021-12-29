---
slug: introducing-hyper-fetch
title: Introducing Hyper Fetch
authors: maciej
tags: [Javascript, Fetch, XHR, React, Hooks]
---

TBD - content

## Welcome!

We are very happy to introduce [Hyper Fetch](https://github.com/BetterTyped/hyper-fetch) tool that helps to interact
with requests on the frontend side.

The idea for Hyper Fetch was shaped over the years of work on many projects in which I encountered various problems in
the subject of fetching, request queueing, persistence, offline and data caching. This project was created to solve most
of them, and the most problematic or seemingly inaccessible - due to the level of complexity.

## Builder, Client and Command

Why builder pattern in this case?

Why class based approach? What it gives in terms of plugins creation and testing.

Why and how we keep it backend agnostic yet adding possibility to use default client.

What is a difference while using command - how fast, easy and type accurate it is. What config possibilities it gives
with caching queueing, canceling etc

## Queues, Persistance and cache

Why two queues for submitting and fetching?

How the command approach connected with events allowed us to accomplish requests persistance? Limitations.

How cache keep data fresh and how it can persist between sessions. What possibilities it gives to developers.

## Summary

- This is not our last word - more to come
- We count on community with base tool set that we give.
- Help us to grow and to build the best fetching ecosystem out there.
