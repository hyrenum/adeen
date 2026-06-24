import { useParams, Link } from "react-router-dom";
import { Layout } from "Client/Component/Layout/Index";
import { Container } from "Client/Component/UI/Container";
import { Button } from "Client/Component/UI/Button";
import { ArrowLeft } from "lucide-react";
import { PROPHETS } from "./Index";

type Section = { heading: string; body: string };
type Detail = { title: string; sections: Section[] };

const DETAILS: Record<string, Detail> = {
  Adam: {
    title: "Adam (عليه السلام)",
    sections: [
      { heading: "Who he was", body: "Adam was the first human and the first Prophet of Allah. He was created by Allah from clay and given life by Allah's command. Allah taught him the names of all things and commanded the angels to prostrate to him as a sign of honour." },
      { heading: "In Paradise", body: "Adam and his wife Hawwa were placed in Paradise and permitted to enjoy everything in it except one tree. Iblis whispered to them and they ate from the forbidden tree, after which they were sent to Earth as Allah had decreed." },
      { heading: "Repentance", body: "Adam learned words of repentance from his Lord, turned back to Him, and Allah accepted his repentance — a reminder that the door of tawbah is always open." },
      { heading: "Legacy", body: "Adam is the father of mankind. His story teaches responsibility, the enmity of Shaytan, and the mercy of Allah." },
    ],
  },
  Idris: {
    title: "Idris (عليه السلام)",
    sections: [
      { heading: "His knowledge", body: "Idris is mentioned in the Qur'an as a man of truth and a Prophet. Scholars say he was among the first to write with the pen and to study the stars." },
      { heading: "His rank", body: "Allah raised him to a high station, as mentioned in Surah Maryam (19:57)." },
    ],
  },
  Nuh: {
    title: "Nuh (عليه السلام)",
    sections: [
      { heading: "His call", body: "Nuh called his people to worship Allah alone for 950 years, but only a few believed." },
      { heading: "The Ark", body: "Allah commanded him to build a great Ark. When the flood came, the believers and pairs of every kind were saved while the disbelievers were drowned." },
      { heading: "Lesson", body: "Patience in da'wah and trust in Allah's plan, no matter how few respond." },
    ],
  },
  Hud: { title: "Hud (عليه السلام)", sections: [
    { heading: "His people", body: "Hud was sent to the powerful tribe of 'Ad, who built tall monuments and were arrogant due to their strength." },
    { heading: "Their end", body: "When they rejected him, Allah destroyed them with a furious, sustained wind. Hud and the believers were saved." },
  ]},
  Salih: { title: "Salih (عليه السلام)", sections: [
    { heading: "The she-camel", body: "Salih was sent to Thamud. As a sign, Allah brought forth a she-camel from a rock. The people hamstrung her, defying Allah." },
    { heading: "Their punishment", body: "They were seized by a mighty blast and destroyed for their arrogance." },
  ]},
  Ibrahim: { title: "Ibrahim (عليه السلام)", sections: [
    { heading: "Friend of Allah", body: "Ibrahim is called Khalil-ullah, the close friend of Allah. He smashed the idols of his people and stood alone for tawhid." },
    { heading: "The fire", body: "Nimrod threw him into a great fire, but Allah commanded the fire to be cool and safe for him." },
    { heading: "Sacrifice", body: "He was tested with the command to sacrifice his son Ismail; both submitted, and Allah ransomed Ismail with a great ram." },
    { heading: "Legacy", body: "He and Ismail built the Ka'bah in Makkah and called people to Hajj." },
  ]},
  Lut: { title: "Lut (عليه السلام)", sections: [
    { heading: "His people", body: "Lut was sent to the people of Sodom who committed great immorality. He warned them but they refused." },
    { heading: "Their destruction", body: "Their cities were overturned and stones of baked clay rained down upon them; Lut and the believers were saved." },
  ]},
  Ismail: { title: "Ismail (عليه السلام)", sections: [
    { heading: "Son of Ibrahim", body: "Ismail was the firstborn son of Ibrahim and Hajar. He showed great patience and submission to Allah from a young age." },
    { heading: "Zamzam", body: "When left in the valley of Makkah, his mother ran between Safa and Marwa, and Allah caused Zamzam to spring forth for him." },
    { heading: "The Ka'bah", body: "He helped his father Ibrahim raise the foundations of the Ka'bah." },
  ]},
  Ishaq: { title: "Ishaq (عليه السلام)", sections: [
    { heading: "Glad tidings", body: "Ishaq was the son of Ibrahim and Sarah, given as glad tidings in their old age." },
    { heading: "A prophet from a prophet", body: "He was a prophet, and his son Ya'qub continued the prophetic line." },
  ]},
  Yaqub: { title: "Yaqub (عليه السلام)", sections: [
    { heading: "Israel", body: "Ya'qub, also called Isra'il, was the son of Ishaq and father of the twelve tribes." },
    { heading: "Patience", body: "He bore the loss of his beloved son Yusuf with beautiful patience until Allah reunited them." },
  ]},
  Yusuf: { title: "Yusuf (عليه السلام)", sections: [
    { heading: "The dream", body: "As a boy, Yusuf saw a dream of eleven stars, the sun and the moon prostrating to him — a sign of his future." },
    { heading: "Trials", body: "He was thrown into a well by his brothers, sold into slavery, tested with temptation, and imprisoned unjustly — yet remained patient and pure." },
    { heading: "Reunion", body: "Allah raised him to authority in Egypt, where he was reunited with his family and forgave his brothers." },
  ]},
  Ayyub: { title: "Ayyub (عليه السلام)", sections: [
    { heading: "His trial", body: "Ayyub was tested with the loss of his wealth, family, and health for many years. He never complained to anyone but Allah." },
    { heading: "His relief", body: "Allah commanded him to strike the ground with his foot; a cool spring gushed out and restored him completely." },
  ]},
  "Shu'ayb": { title: "Shu'ayb (عليه السلام)", sections: [
    { heading: "Justice in trade", body: "Shu'ayb was sent to Madyan to call them away from cheating in measures and weights." },
    { heading: "Their end", body: "When they rejected him, an overwhelming blast seized them and they were destroyed." },
  ]},
  Musa: { title: "Musa (عليه السلام)", sections: [
    { heading: "Early life", body: "Musa was raised in the palace of Fir'awn after Allah inspired his mother to place him in the river." },
    { heading: "The call", body: "Allah spoke to him directly at the blessed valley of Tuwa and sent him to Fir'awn with clear signs." },
    { heading: "The exodus", body: "He led the Children of Israel out of Egypt; Allah split the sea for them and drowned Fir'awn." },
    { heading: "The Torah", body: "Allah revealed the Tawrah to him on Mount Tur." },
  ]},
  Harun: { title: "Harun (عليه السلام)", sections: [
    { heading: "Brother of Musa", body: "Harun was the brother of Musa and his vizier, gifted with clear speech." },
    { heading: "His role", body: "He supported Musa in confronting Fir'awn and guiding the Children of Israel." },
  ]},
  "Dhul-Kifl": { title: "Dhul-Kifl (عليه السلام)", sections: [
    { heading: "Among the patient", body: "Allah counts him among the patient and the righteous in the Qur'an. He upheld justice and kept his promises." },
  ]},
  Dawud: { title: "Dawud (عليه السلام)", sections: [
    { heading: "King and Prophet", body: "Dawud defeated Jalut (Goliath) and Allah gave him kingship, wisdom, and the Zabur." },
    { heading: "Worship", body: "He was the most devoted in worship — fasting alternate days and standing in prayer at night." },
  ]},
  Sulayman: { title: "Sulayman (عليه السلام)", sections: [
    { heading: "His kingdom", body: "Sulayman, the son of Dawud, was given a kingdom unlike any other — control over the wind, jinn, and the speech of animals." },
    { heading: "Queen of Sheba", body: "He invited the Queen of Sheba (Bilqis) to Islam, and she submitted with him to the Lord of the worlds." },
  ]},
  Ilyas: { title: "Ilyas (عليه السلام)", sections: [
    { heading: "Against Ba'l", body: "Ilyas was sent to a people who worshipped an idol called Ba'l. He called them to worship Allah alone." },
  ]},
  "Al-Yasa": { title: "Al-Yasa (عليه السلام)", sections: [
    { heading: "The chosen", body: "Allah counts him among the excellent and the chosen. He continued the work of Ilyas." },
  ]},
  Yunus: { title: "Yunus (عليه السلام)", sections: [
    { heading: "The fish", body: "Yunus left his people in frustration without permission and was swallowed by a great fish." },
    { heading: "His du'a", body: "In the darkness he called out: 'There is no god but You, glory be to You; indeed I was of the wrongdoers.' Allah saved him and brought his people to faith." },
  ]},
  Zakariya: { title: "Zakariya (عليه السلام)", sections: [
    { heading: "Du'a for a son", body: "In old age Zakariya prayed for a righteous heir, and Allah granted him Yahya as a sign." },
  ]},
  Yahya: { title: "Yahya (عليه السلام)", sections: [
    { heading: "Pure youth", body: "Yahya was given wisdom while still a child, and was dutiful, pure, and god-fearing." },
  ]},
  Isa: { title: "Isa (عليه السلام)", sections: [
    { heading: "Miraculous birth", body: "Isa was born to Maryam by Allah's word, without a father, as a sign for mankind." },
    { heading: "His miracles", body: "By Allah's permission he healed the blind and the leper, gave life to the dead, and made a bird from clay." },
    { heading: "His message", body: "He called Bani Isra'il to worship Allah alone and gave glad tidings of a Messenger to come after him named Ahmad." },
    { heading: "His ascension", body: "He was not crucified; Allah raised him to Himself, and he will return before the Day of Judgement." },
  ]},
  Muhammad: { title: "Muhammad (ﷺ)", sections: [
    { heading: "The final Messenger", body: "Muhammad ﷺ is the seal of the Prophets, sent as a mercy to all the worlds." },
    { heading: "Revelation", body: "The Qur'an was revealed to him over 23 years through the angel Jibril, beginning in the cave of Hira." },
    { heading: "His character", body: "His wife Aishah said his character was the Qur'an — truthful, merciful, just, and humble." },
    { heading: "His legacy", body: "He established the religion, completed the message, and left behind the Book of Allah and his Sunnah as guidance until the Day of Judgement." },
  ]},
};

export default function ProphetDetail() {
  const { name = "" } = useParams();
  const key = decodeURIComponent(name);
  const data = DETAILS[key];
  const exists = PROPHETS.includes(key);

  return (
    <Layout>
      <div className="space-y-4">
        <Link to="/Aid/Prophets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        {!exists ? (
          <Container className="!p-6 text-center">Prophet not found.</Container>
        ) : data ? (
          <>
            <Container className="!p-5">
              <h1 className="text-2xl font-bold">{data.title}</h1>
            </Container>
            {data.sections.map((s) => (
              <Container key={s.heading} className="!p-5">
                <p className="font-semibold">{s.heading}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
              </Container>
            ))}
          </>
        ) : (
          <Container className="!p-6 text-center">
            <h1 className="text-xl font-bold">{key} (عليه السلام)</h1>
            <p className="text-sm text-muted-foreground mt-2">Detailed content coming soon.</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}
