import { generateText } from '@superdapp/agents';

async function main() {
  const res = await generateText('Say hi from SuperDapp AI!');
  console.log(res); // text output
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
