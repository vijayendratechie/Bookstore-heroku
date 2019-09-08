const assert = require("chai").assert;
const server = require("../server");

describe('server',function(){
	it('add function is working',function(){
		assert.equal(server(),'hello');
	});
});