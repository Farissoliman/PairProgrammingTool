# Project Architecture and User Flows

## Summary

- The frontend in this project is built with **React** and **Next.js**. It will be _embedded_ in the
  VSCode sidebar using a WebView and an extension.
- The backend relies on Next.js API routes, and it is an interface layer between the frontend and **MongoDB**.

## Frontend

1. When the user first opens the site, they are asked to enter their and their partner's unique identifiers.
1. Once this is complete, they will have the option to start the session as a driver or a navigator.
1. Once either user completes the previous step, the session will start for both of them. This will
   open the screen with tips, statistics, and remaining time.
1. The frontend will continuously poll the backend for the user's information, and put it into a format
   that is useful for the user to read.

## Backend

- Receives information from Faris's tool (facial & voice recognition data) and the VS Code extension (lines written).
  This information is used to add an `interval` to a MongoDB document.
- Through the `/api/stats/:uid` endpoint, the backend queries MongoDB and returns the document with the matching `uid` in a JSON format.
