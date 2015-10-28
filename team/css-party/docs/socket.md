Changes feed
====

- when you make a connection to the feed, we ask for _"all changes after N"_ where `N` is the sequence number of the last change we know about.
- if the tail of the feed has moved beyond `N` (history doesn't go far back enough) the server sends the entire state and we listen from the head.
