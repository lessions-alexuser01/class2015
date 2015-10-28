export default (posts) => {
  return posts
    //.filter(post => !post.data.over_18)
    .map(post => post.data.url)
    //.filter(url => /.gif?$/.exec(url))
    .map(url => url.replace(/gif.*$/, 'gif'))
}
