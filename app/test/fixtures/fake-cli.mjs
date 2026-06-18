// A stand-in for the engine CLI used to test spawnEngine's NDJSON parsing in
// isolation. Invoked as: node fake-cli.mjs --json <mode>
const mode = process.argv[3];
const out = process.stdout;

if (mode === "fail") {
  process.stderr.write("boom: something broke\n");
  process.exit(1);
}

out.write('{"type":"phase","name":"slides","status":"start"}\n');
out.write("this is not json and must be ignored\n");
out.write('{"type":"slide.rendered","frameId":"01","path":"/x/01.png","verified":true}\n');

// Split one event across two stdout writes to exercise line buffering.
const split = '{"type":"voice.done","segId":"01","duration":3.5,"source":"estimate"}\n';
out.write(split.slice(0, 22));
setTimeout(() => {
  out.write(split.slice(22));
  out.write(
    '{"type":"result","result":{"lessonId":"T","status":"assembled","segments":1,"totalDuration":3.5,"message":"done"}}\n',
  );
  process.exit(0);
}, 10);
