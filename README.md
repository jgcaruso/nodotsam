# nodotsam
Mastodon web client with reverse scrolling

You can run your own version locally, or visit [nodotsam.party](https://nodotsam.party/)

This started as an experiment, but I've been using it as my main client since I started development. Any missing features are currently being backfilled by providing links to your instance's website (ex `see toot` opens the instance web interface to allow you to view the thread or fav/boost/reply/etc) but I intend to add those most common features directly to this app over time.

I'm currently adding features based on things that I need for my current usage of mastodon, but feel free to create issues or PRs for features you need. I'm happy to work with others on this!

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

