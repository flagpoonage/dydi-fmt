// DYDI Bytes
const MAGIC_HEADER = new Uint8Array([68, 89, 68, 73]);

async function makeDydi(options) {
  const { from1900, questions, answers } = options;

  const date_bytes = getNumericBytes(from1900);
  const question_bytes = await Promise.all(
    questions.map((a) => getStringBytes(a))
  );

  // 8 bytes offset is the magic header + the date bytes
  const initial_offset = 8;

  const q_buffers = [];

  let dydi_byte_buffer = mergeByteArrays(MAGIC_HEADER, date_bytes);

  for (let i = 0; i < question_bytes.length; i++) {
    const q = questions[i];
    console.log(
      "Question",
      i,
      "is",
      question_bytes[i].byteLength,
      "bytes",
      getNumericBytes(question_bytes[i].byteLength)
    );
    console.log("QBYTES", question_bytes[i]);

    dydi_byte_buffer = mergeByteArrays(
      dydi_byte_buffer,
      getNumericBytes(question_bytes[i].byteLength),
      question_bytes[i]
    );

    console.log("MERGED", dydi_byte_buffer);
  }
}

function mergeByteArrays(...arrs) {
  const total_butes = arrs.reduce((r, v) => {
    console.log("R", r, "BL", v.byteLength, "V", v);
    return r + v.byteLength;
  }, 0);
  console.log("TOTAL", total_butes);
  const merged_array = new Uint8Array(total_butes);
  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    merged_array.set(arrs[i], offset);
    offset += arrs[i].byteLength;
  }

  return merged_array;
}

const MAYBE = 4;
const YES = 2;
const NO = 1;

async function getStringBytes(str) {
  const blob = await new Blob([str]).arrayBuffer();
  const buff = new Uint8Array(blob);
  return buff;
}

function getNumericBytes(num) {
  arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  view = new DataView(arr);
  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

makeDydi({
  from1900: 1000,
  questions: [
    "Did you get enough sleep",
    "Are you the coolest person in the world",
    "Are you feeling sick",
    "Did you excercise",
  ],
  answers: [
    [YES, YES, NO, NO],
    [MAYBE, YES, YES, NO],
    [NO, YES, NO, YES],
  ],
});
