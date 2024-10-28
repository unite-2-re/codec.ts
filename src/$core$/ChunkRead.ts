import { crc32_buf } from "./CRC32.mjs";

//
export class PNGChunk {
    len = 0;
    name = "IEND";
    data = new Uint8Array();
    crc = 0;

    //
    constructor(len, name, data, crc = 0) {
        this.len = len;
        this.name = name;
        this.data = data;
        this.crc = crc;
    }

    //
    calculateCRC() {
        this.crc = crc32_buf(new Uint8Array([this.name.split("").map((s)=>s.codePointAt(0)) as number[], Array.from(this.data)].flat()));
        return this.crc;
    }

    //
    makeUint32(v = 0) {
        return [(v>>24)&0xFF, (v>>16)&0xFF, (v>>8)&0xFF, v&0xFF];
        //return [v&0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
    }

    //
    makeBinary() {
        return new Uint8Array([this.makeUint32(this.len), this.name.split("").map((s)=>s.codePointAt(0)) as number[], Array.from(this.data), this.makeUint32(this.calculateCRC())].flat() as number[]);
    }
}

//
export const validSignature = {
    png: new Uint8Array([137,80,78,71,13,10,26,10]),
    jng: new Uint8Array([139,74,78,71,13,10,26,10]),
    mng: new Uint8Array([138,77,78,71,13,10,26,10])
}

//
export default class ChunkReader {
    #data: Uint8Array = new Uint8Array();
    #options = {};
    #signature: Uint8Array = new Uint8Array();
    #chunks: PNGChunk[] = [];

    //
    constructor(data, options = {}) {
        this.#data = data;
        this.#options = options;
        this.#chunks = [];
    }

    //
    slice(start = 0, length = 1) {
        return new Uint8Array(this.#data.buffer, this.#data.byteOffset+start, length);
    }

    //
    readUint32(start = 0) {
        return new DataView(this.#data.buffer, this.#data.byteOffset+start, 4).getUint32(0, false);
    }

    //
    readAsRawString(start = 0, length = 1) {
        return String.fromCodePoint.apply(null, this.slice(start, length) as unknown as number[]);
    }

    //
    readSignature(start = 0) {
        this.#signature = this.slice(start, 8);
        return this.#signature;
    }

    //
    readChunk(start) {
        const len = this.readUint32(start);
        const name = this.readAsRawString(start+4, 4);
        const data = this.slice(start+8, len);
        const crc = this.readUint32(start+8+len);
        return new PNGChunk(len, name, data, crc);
    }

    //
    readData(data: Uint8Array | null = null) {
        this.#data = data || this.#data;
        this.#signature = this.readSignature();
        let offset = 8;
        while (offset < this.#data.byteLength) {
            const chunk = this.readChunk(offset);
            offset += chunk.len + 12;
            this.#chunks.push(chunk);
        }
        return this;
    }

    //
    get chunks() {
        return this.#chunks;
    }

    //
    get signature() {
        return this.#signature;
    }

    //
    reconstruct() {
        const hasAlpha = this.#chunks.find((c)=>["JDAA","IDAT","JdAA"].indexOf(c.name)>=0);
        const JDAA = this.#chunks.find((c)=>["JdAA"].indexOf(c.name)>=0) ? "JdAA" : "JDAA";
        return [reconstructJPEG(this.#chunks), hasAlpha ? (this.#chunks.find((c)=>[JDAA].indexOf(c.name)>=0) ? reconstructJPEG(this.#chunks, JDAA) : reconstructPNG(this.#chunks)) : null];
    }
}

// not supported JSEP chunks
export const reconstructJPEG = (chunks, type = "JDAT") => {
    return new Blob(chunks.filter((c)=>c.name==type).map((c)=>c.data), {type: "image/jpeg"});
}

//
export const reconstructPNG = (chunks)=>{
    const signature = validSignature.png;
    const idats = chunks.filter((c)=>c.name=="IDAT");
    const jhdr = chunks.find((c)=>c.name=="JHDR");
    const ihdrA = new ArrayBuffer(13);
    const ihdrView = new DataView(ihdrA);
    const jhdrView = new DataView(jhdr.data.buffer, jhdr.data.byteOffset, jhdr.data.byteLength);

    // just copy 2D size to PNG
    ihdrView.setUint32(0, jhdrView.getUint32(0));
    ihdrView.setUint32(4, jhdrView.getUint32(4));

    //
    ihdrView.setUint8(8, jhdrView.getUint8(12));
    ihdrView.setUint8(9, 0);
    ihdrView.setUint8(10, jhdrView.getUint8(13));
    ihdrView.setUint8(11, jhdrView.getUint8(14));
    ihdrView.setUint8(12, jhdrView.getUint8(15));

    //
    const ihdr = new PNGChunk(13, "IHDR", new Uint8Array(ihdrA));
    const iend = new PNGChunk(0, "IEND", new Uint8Array([]));

    //
    return new Blob([signature, ...([ihdr, ...idats, iend].map((c)=>c.makeBinary()))], {type: "image/png"});
}
