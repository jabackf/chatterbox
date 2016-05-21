$(function(){
	var socket = io.connect();
	var $messageForm=$('#messageForm');
	var $message=$('#message');
	var $chat=$('#chat');
	var $users=$('#users');

	var $userForm=$('#userLoginForm');
	var $userNameInput=$('#userNameInput');

	var user="";  //This will hold our username after we've logged in

	//Log in is called after the server accepts our user name. It switches the app to chat mode and assigns our
	//user name variable. un= user name.
	function login(un){
		user=un;
		$('#userLogin').slideUp();
		$('#messageArea').slideDown();
	}


	//This function logs a message to the chat window. Header is the header of the message, message is the message,
	//and class is a css class for styling the message
	function chatlog(header,message,mclass=""){
		$("<div class='"+mclass+"''><strong>"+header+": </strong>"+message+"</div>").appendTo($chat).effect( "highlight", {color:"#F9EFAF"}, 1500 );
		$($chat).scrollTop($($chat)[0].scrollHeight);
	}

	//Handle user name submission. This submits a user name to the server to be evaluated.
	$userForm.submit(function(e){
		e.preventDefault();
		socket.emit('request login',$userNameInput.val());
		
	});

	//When a user clicks log off, we simply refresh the page to reset the app
	$("#logoffbutton").click(function(){
		location.reload();
	});

	//When a user submits a message, emit a 'send message' event to server containing a username and message
	$messageForm.submit(function(e){
		e.preventDefault();
		socket.emit('send message',{ usr:user, msg:$message.val() });
		$message.val(''); //Empty the message window
	});

	//This is called when the server accepts a user name during logon. It completes the log in process
	//by calling the  login function
	socket.on('user request accepted', function(data){
		login(data.usr);
	});

	//This is called when the server rejects a user name request. It displays an error message to the
	//user that was sent back from the server
	socket.on('user request rejected', function(data){
		$('#loginErrors').show();
		$('#loginErrors').effect( "highlight", {color:"#F9EFAF"}, 1000 );
		$('#loginNotification').hide();
		$('#loginErrors').html("<strong>Error: </strong>"+data.log);
	});

	//Someone has submitted a new message and the server is sending it to us. We simply log the username
	//and message to the chat window.
	socket.on('new message',function(data){
		chatlog(data.usr,data.msg,"chat-user-message");
	});

	//The server is letting us know that the user list has been updated. Here we change our user window
	//to reflect the new user list.
	socket.on('user list',function(data){
		$users.empty();
		$.each(data.usr, function(i, val){
			var mclass = (user==val) ? "meicon" : "usericon";
			$("<li class='list-group-item'><span class='"+mclass+"'></span>"+val+((user==val)?"  (Me)":"")+"</li>").appendTo($users).effect( "highlight", {color:"#F5EFAC"}, 1500 );
		});
		chatlog(">System message",data.log,"console-system-message");
		$('.users-currently-online').html(data.usr.length);
	});

	//The server has sent us a count of the number of users logged in. This is separate from the user list function
	//so we can get the number of users before we log in and display it on the log in page.
	socket.on('user count',function(data){
		$('.users-currently-online').html(data);
	});
});