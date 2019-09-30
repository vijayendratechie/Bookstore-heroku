$(document).ready(function()
{


	$("#signupbtn").click(function()
	{
		$("#serror").css("display", "none");
	})

	$("#loginbtn").click(function()
	{
		$("#lerror").css("display", "none");
	})

	$("#signup").click(function()
	{
		
		var name = $("#sname").val();
		var email = $("#semail").val();
		var password = $("#spassword").val();
		var phone = $("#phone").val();
		
		/*/[0-9]{4}-[0-9]{3}-[0-9]{3}/*/

		console.log("Signup info is : "+phone);
		
		if(name=="" || email=="" || password=="")
		{
			alert("Please enter required fields");
		} 
		else if(phone.length==0 || phone.length==10)
		{
			$("#cover").css("display", "block").fadeIn(100);
			$('body').css('overflow','hidden');
			console.log("send data");
			$.ajax({
			    type: "POST",
			    url: "https://discountedtrade.in/signup",
			    data: {name : name,email : email,password : password,phone : phone},
			    dataType: "json",
			    success: function(info)
			    {   
			      	//console.log("Callback info is :"+info);
			      	$("#cover").fadeOut(100);
		    		$('body').css('overflow','visible');
		    		$("#cover").css("display", "none");
			      	if(info.message == -1)
			      	{
			      		$("#serror").addClass("alert-danger")
			      		$("#serror").html("Error while signup.Please signup again.");
			      		$("#serror").css("display", "block");
			      	}
			      	else if(info.message == 1)
			      	{	
			      		$("#serror").addClass("alert-danger")
			      		$("#serror").html("Email already exists.Please verify your mail address.");
			      		$("#serror").css("display", "block");
			      	}
			      	else if(info.message == 2)
			      	{	
			      		$("#serror").addClass("alert-danger")
			      		$("#serror").html("Email already exists.Please login.")
			      		$("#serror").css("display", "block");			      		
			      		
			      	}
			      	else if(info.message == "verficationemailsent")
			      	{
			      		$("#lerror").addClass("alert-success")
			      		$("#lerror").html("Verification email sent. Please verify you email and then login");
			      		$("#lerror").css("display", "block");
			      		$('#loginModal').modal('toggle');
			      		$('#signupModal').modal('toggle');
			      					      		
			      	}
			    		
			    },
			    error: function(XMLHttpRequest, textStatus, errorThrown)
			    {
					console.log("Error in signup");	    	
			    }
		    });	
		}
		else 
		{
			alert("Please enter mobile number in specified format");
		}
	})

	$("#login").click(function()
	{
		var email = $("#lemail").val();
		var password = $("#lpassword").val();

		if(email=="" || password=="")
		{
			alert("Please enter all fields");
		} 
		else
		{
			//console.log(""+email+" "+password);

			$("#cover").css("display", "block").fadeIn(100);
			$('body').css('overflow','hidden');
			
			$.ajax({
			    type: "POST",
			    url: "http://discountedtrade.in/login",
			    data: {email : email,password : password},
			    dataType: "json",
			    success: function(info)
			    {   
			      	//console.log(info.message[0]);
			      	
			      	if(info.message == "success")
			      	{
			      	
			      		//window.location.href = "https://discountedtrade.herokuapp.com/";
			      		$("#cover").fadeOut(100);
		    			$("#cover").css("display", "none");
			      		window.location.href = "https://discountedtrade.in/";	
			      	}
			      	else
			      	{
			      		$('body').css('overflow','visible');
			      		$("#cover").fadeOut(100);
		    			$("#cover").css("display", "none");
			      		$("#lerror").addClass("alert-danger")
			      		$("#lerror").html(info.message[0]);
			      		$("#lerror").css("display", "block");
			      	}			    		
			    },
			    error: function(XMLHttpRequest, textStatus, errorThrown)
			    {
			    	
			    }
		    });	
		}	
	})


});
