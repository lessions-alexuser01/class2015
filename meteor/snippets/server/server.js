// Server side codes
//
Meteor.publish('snippets', function() {
  return Snippets.find({owner: this.userId});
})

Snippets.allow({
  insert: function(userId, fields){
    return(userId);
  }
})
