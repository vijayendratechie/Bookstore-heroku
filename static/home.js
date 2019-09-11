$(document).ready(function()
{
	$('[data-toggle="tooltip"]').tooltip();

	var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	
	if (isMobile) 
	{
		//alert("Mobile");	
		$("#cover").remove();
	} 
});



function buybook(bookid,id,user)
{
	console.log("user is :"+JSON.stringify(user));
	if(user!= true)
	{
		alert("Login to buy or add books");
	}
	else
	{
		//console.log("function is :"+JSON.stringify(id));

		$("#cover").css("display", "block").fadeIn(100);		
		$('body').css('overflow','hidden');	

		$.ajax({
		    type: "POST",
		    url: "https://discountedtrade.herokuapp.com/buybook",
		    data: {id : bookid},
		    dataType: "text",
		    success: function(info)		    
		    {     
		    	console.log("Callback info is :"+info);	
		    	$('#'+id).html("Sold").attr("disabled",true);
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
}

