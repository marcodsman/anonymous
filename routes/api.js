/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const CONNECTION_STRING = process.env.DB;

// ********
// MONGOOSE
// ********
const mongoose = require('mongoose');
mongoose.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, db){
  if(err){
    console.log(err);
  } else {
    console.log("Connected to database " + db.name);
  }
})

// =======
//  MODELS
// =======
var boardSchema = new mongoose.Schema({
  board_name: {
    type: String,
    unique: true,
    required: true
  },
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread"
    }
  ]
});
var Board = mongoose.model("Board", boardSchema);

var threadSchema = new mongoose.Schema({
  text: String,
  delete_password: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  replycount: Number,
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply"
    }
  ]
});
var Thread = mongoose.model("Thread", threadSchema);

var replySchema = new mongoose.Schema({
  text: String,
  created_on: String,
  delete_password: String,
  reported: Boolean
});
var Reply = mongoose.model("Reply", replySchema);

// Seed a new board
//  ==============
// Board.create({
//   board_name: "test"
// }, function(err, board){
//   if(err){
//     console.log(err);
//   } else {
//     console.log(board);
//   }
// });

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    // Create a new thread
    .post(function(req, res){
      var newThread = {
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replycount: 0
      };
      
      Board.findOneAndUpdate({board_name: req.params.board}, {board_name:req.params.board}, {upsert: true, new: true}, function(err, foundBoard){
        if(err){
          console.log("An error occured: ", err);
        } else {
          
          Thread.create(newThread, function(err, addedThread){
            if(err){
              console.log(err);
            } else {
              foundBoard.threads.push(addedThread);
              foundBoard.save();
              res.redirect('/b/' + req.params.board + "/")
            }
          });
        }
      });

    })
    // Show board
    .get(function(req, res){
      Board.find({board_name: req.params.board})
        .populate({
          path:"threads",
          select: "-reported -delete_password -__v",
          options: {
            limit: 10,
            sort: {bumped_on: -1}
          },
          populate: {
            select: "-reported -delete_password -v__",
            options: {
              limit: 3,
              sort: {created_on: -1}
            }, // not sure if right syntax. took a guess
            path: "replies",
            model: "Reply"
          }
        })
        .exec(function(err, foundBoard){
          if(err){
            console.log(err);
          } else {
            res.json(foundBoard[0].threads);
          }
        });
      })
      // Report a thread
      .put(function(req, res){
        Thread.findByIdAndUpdate(req.body.report_id, {reported: true}, function(err, foundThread){
          if(err){
            console.log(err);
            res.send("Oops, something went wrong");
          } else {
            console.log("Thread reported: " + foundThread._id)
            res.send("success");
          }
        });
      })
      // Delete a thread
      .delete(function(req, res){
        Thread.findOneAndRemove({_id: req.body.thread_id, delete_password: req.body.delete_password}, function(err, result){
          if(err){console.log(err)}
          if(!result){
            res.send("incorrect password");
          } else {
            res.send("success");
          }
        });
      });
    
  app.route('/api/replies/:board')
    // Post a reply
    .post(function(req, res){                          
      var thread_id = req.body.thread_id
      var newReply = {
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
      }
      Thread.findOne({_id:req.body.thread_id}, function(err, foundThread){
        if(err){
          console.log(err);
        } else {
          // Bump the thread
          foundThread.bumped_on = new Date();
          foundThread.replycount = foundThread.replies.length+1;// A bit of a hack but okay
          foundThread.save();
          Reply.create(newReply, function(err, addedReply){
            if(err){
              console.log(err);
            } else {
              foundThread.replies.push(addedReply);
              foundThread.save();
              res.redirect("/b/" + req.params.board + "/" + req.body.thread_id);
            }
          });
        }
      })
    })
    // Replies page
    .get(function(req, res){
      Thread.find({_id: req.query.thread_id},)
        .populate({
          path:"replies",
          select: "-delete_password -v__ -reported"
        })
        .exec(function(err, foundThread){
          if(err){
            console.log(err);
          } else {
            res.json(foundThread[0]);
          }
        });
    })
    // Report a reply
    .put(function(req, res){
      Reply.findByIdAndUpdate(req.body.reply_id, {reported: true}, function(err, foundReply){
        if(err){
          console.log(err);
          res.send("Oops, something went wrong!");
        } else {
          console.log("Reply reported: "+ foundReply._id);
          res.send("success");
        }
      });
    })
  
    // Delete a reply
    .delete(function(req, res){
      Reply.findOneAndRemove({_id:req.body.reply_id, delete_password: req.body.delete_password}, function(err, result){
        if(err){console.log(err)}
        if(!result){
          res.send("incorrect password");
        } else {
          res.send("success");
        }
      });

    })
  

};
