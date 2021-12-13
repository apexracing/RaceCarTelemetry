import { Parser } from 'binary-parser';

class ACRemoteTelemetryParser {
	constructor() {
		this.parser=new Parser();
	}
		
  /**
     * @param {Buffer} buffer
     */
  fromBuffer(buffer) {
    return this.parser.parse(buffer);
  }
}

export default ACRemoteTelemetryParser;
