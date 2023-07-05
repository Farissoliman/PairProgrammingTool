# API Documentation

#### GenderTool Backend

## Definitions

Every user has a unique **`uid`**. It can be of any format, as
long as it's a string that MongoDB will accept as an ObjectId.

This `uid` is used to access a user's statistics and to post
new ones to their document.

## `GET /api/stats/:uid`

Returns all the user's recorded stats. No query parameters or request body is necessary.

**Example response:**

```json
{
    "_id": "test_user_0001",
    "session_start": 1688531280787,
    "intervals": [
        {
            "status": "driver",
            "start": 1688531280787,
            "lines_written": 9,
            "utterances": [
                1688531280787,
                1688531285787,
                1688531290787
            ]
        }
    ]
}

* `_id` is the user's `uid`.
* `session_start` is a Unix timestamp of when the session started.
* `intervals` is an array of `Interval` objects, containing info about each time the user was either driver or navigator.
  * `status` represents the user's role during the interval.
  * `start` is a Unix timestamp representing the time the interval started.
  * `lines_written` is the number of lines of code that the user wrote during the interval. Should only be >0 when `status` is `driver`, but this isn't enforced.
  * `utterances` is an array of Unix timestamps representing the times of each words. Used for interruption detection.
```

## `POST /api/update/:uid`

Adds some new data to the user's intervals,
allowing them to view updated statistics.

This should be called for each user,
but only when they switch positions (driver <-> navigator)
OR when the session ends.

**Example request body**
The request body should be a JSON-formatted `Interval`.

```json
{
  "status": "driver",
  "start": 1688531280787,
  "lines_written": 9,
  "utterances": [1688531280787, 1688531285787, 1688531290787]
}
```

No response should be expected. After this endpoint is called
successfully, the response of `GET /api/stats/:uid` should
include the new information.
