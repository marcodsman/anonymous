/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  var _id1; // For delete
  var _id2; // For report
  var _id3; // For replies
  var _id4; // For reply report
  var _id5; // For delete reply

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test("POST new thread", function(done){
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text: "Chai New Thread Test",
            delete_password: "Chai"
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            done();
          })
      });
    });
    
    suite('GET', function() {
      test("GET Threads page", function(done){
        chai.request(server)
          .get('/api/threads/test')
          .query({})
          .end(function(err ,res){
            assert.equal(res.status, 200);
            assert.isAtMost(res.body.length, 10, "There should only be ten posts returned");
            assert.isAtMost(res.body[0].replies.length, 3, "There should be no more than three replies shown");
            assert.equal(res.body[0].text, "Chai New Thread Test");
            assert.exists(res.body[0].created_on, "Must return date");
            assert.exists(res.body[0].bumped_on, "Must return date");
            assert.exists(res.body[0]._id, "Must return id");
            assert.notExists(res.body[0].reported, "User must not know if thread has been reported");
            assert.notExists(res.body[0].delete_password, "User must not see the passwords");
            assert.isArray(res.body);
            //Save id for later delete test
            _id1 = res.body[7]._id;
            _id2 = res.body[1]._id;
            _id3 = res.body[5]._id;
            done();
          });
      })
    });
    
    suite('DELETE', function() {
      test("Incorrect password", function(done){
        chai.request(server)
          .delete("/api/threads/test")
          .send({thread_id: _id1, delete_password: "wrong password"})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
        });
        
        test("Correct password", function(done){
          chai.request(server)
            .delete("/api/threads/test")
            .send({thread_id: _id1, delete_password: "Chai"})
            .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "success");
              done();
            })
        });
    });
    
    suite('PUT', function() {
      test("Report thread", function(done){
        chai.request(server)
          .put("/api/threads/test")
          .send({report_id: _id2})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test("POST Reply", function(done){
        chai.request(server)
          .post("/api/replies/test")
          .send({
            text: "Chai Message Test",
            delete_password: "Chai",
            thread_id: _id3
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test("GET Replies Page", function(done){
        chai.request(server)
          .get("/api/replies/test")
          .query({thread_id: _id3})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.replies[0].text, "Chai Message Test");
            assert.exists(res.body.replies[0].created_on, "Must include data");
            assert.exists(res.body.replies[0]._id, "ID must be returned");
            assert.notExists(res.body.replies[0].delete_password, "Password must not be returned");
            assert.notExists(res.body.replies[0].reported, "Reported status must not be returnded");
            assert.isArray(res.body.replies);
            _id4 = res.body.replies[0]._id; // For report reply
            _id5 = res.body.replies[1]._id; // For delete reply
            done();
          })
      });
    });
    
    suite('PUT', function() {
      test("Report a reply", function(done){
        chai.request(server)
          .put("/api/replies/test")
          .send({reply_id: _id4})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          })
      });
    });
    
    suite('DELETE', function() {
      test("Wrong password", function(done){
        chai.request(server)
          .delete("/api/replies/test")
          .send({reply_id: _id5, delete_password: "wrong password"})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          })
      });
      test("Correct Password", function(done){
        chai.request(server)
          .delete("/api/replies/test")
          .send({reply_id: _id5, delete_password: "Chai"})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });
  });

});
