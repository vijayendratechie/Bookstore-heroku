$(document).ready(function()
{
	$('[data-toggle="tooltip"]').tooltip();

	var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	
	if (isMobile) {
		console.log("Mobile");
	} 
	else
	{
		console.log("You are using Desktop");
	}
});

var uniquebookcardid;

function buybook(bookid,id,user)
{
	//console.log("user is :"+JSON.stringify(user));
	uniquebookcardid = id;
	if(user!= true)
	{
		alert("Please login to buy or add books");
	}
	else
	{
		console.log("function is :"+JSON.stringify(bookid));

		$("#buyBook").modal('show');
		$('.yesbtn').attr('id',bookid);			
	}	
}

function buyingbookconfirmed(bookid)
{
	console.log("button id is:"+JSON.stringify(bookid));

	$('#buyBook').modal('hide');
	$("#cover").css("display", "block").fadeIn(100);		
	$('body').css('overflow','hidden');	
	$.ajax({
	    type: "POST",
	    url: "http://www.discountedtrade.in/buybook",
	    data: {id : bookid},
	    dataType: "text",
	    success: function(info)
	    
	    {     
	    	console.log("Callback info is :"+info);	
	    	$('#'+uniquebookcardid).html("Sold").attr("disabled",true);
	    	$('body').css('overflow','visible');
	    	$("#cover").fadeOut(100);
	    	$("#cover").css("display", "none");
	    	alert("Thanks for showing interest. The seller will contact you shortly on your mail id");
	    },
	    error: function(XMLHttpRequest, textStatus, errorThrown)
	    {
	    	$('body').css('overflow','visible');
	    	$("#cover").fadeOut(100);
	    	$("#cover").css("display", "none");  
	    	alert("Error while buying.Please try again");
	        console.log('err: '+XMLHttpRequest.status);
	    }
    });
}

function buyingbookcancel()
{
	$('#buyBook').modal('hide');
}