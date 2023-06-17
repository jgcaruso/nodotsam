# nodotsam
Mastodon web client with reverse scrolling

You can run your own version locally, or visit [nodotsam.party](https://nodotsam.party/)


## build and run
```
npm ci
npm start
```

This starts a development server, and everything should just work as-is.

## using the app

1. Click the login link
2. Specify your instance's hostname
3. Complete the oauth flow
4. You will be brought back to a feed with oldest posts on top, newest posts at the bottom
5. The initial post you see will be based on what Mastodon thinks was the last post you read, after that nodotsam will keep track of your last viewed post and maintain your history in local storage

