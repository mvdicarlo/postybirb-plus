import React from 'react';
import { Select } from 'antd';
const { OptGroup, Option } = Select;

export const FurAffinitySpecies = [
  <Option value="1">Unspecified / Any</Option>,
  <OptGroup label="Amphibian">
    <Option value="1001">Frog</Option>
    <Option value="1002">Newt</Option>
    <Option value="1003">Salamander</Option>
    <Option value="1000">Amphibian (Other)</Option>
  </OptGroup>,
  <OptGroup label="Aquatic">
    <Option value="2001">Cephalopod</Option>
    <Option value="2002">Dolphin</Option>
    <Option value="2005">Fish</Option>
    <Option value="2004">Porpoise</Option>
    <Option value="6068">Seal</Option>
    <Option value="2006">Shark</Option>
    <Option value="2003">Whale</Option>
    <Option value="2000">Aquatic (Other)</Option>
  </OptGroup>,
  <OptGroup label="Avian">
    <Option value="3001">Corvid</Option>
    <Option value="3002">Crow</Option>
    <Option value="3003">Duck</Option>
    <Option value="3004">Eagle</Option>
    <Option value="3005">Falcon</Option>
    <Option value="3006">Goose</Option>
    <Option value="3007">Gryphon</Option>
    <Option value="3008">Hawk</Option>
    <Option value="3009">Owl</Option>
    <Option value="3010">Phoenix</Option>
    <Option value="3011">Swan</Option>
    <Option value="3000">Avian (Other)</Option>
  </OptGroup>,
  <OptGroup label="Bears &amp; Ursines">
    <Option value="6002">Bear</Option>
  </OptGroup>,
  <OptGroup label="Camelids">
    <Option value="6074">Camel</Option>
    <Option value="6036">Llama</Option>
  </OptGroup>,
  <OptGroup label="Canines &amp; Lupines">
    <Option value="6008">Coyote</Option>
    <Option value="6009">Doberman</Option>
    <Option value="6010">Dog</Option>
    <Option value="6011">Dingo</Option>
    <Option value="6012">German Shepherd</Option>
    <Option value="6013">Jackal</Option>
    <Option value="6014">Husky</Option>
    <Option value="6016">Wolf</Option>
    <Option value="6017">Canine (Other)</Option>
  </OptGroup>,
  <OptGroup label="Cervines">
    <Option value="6018">Cervine (Other)</Option>
  </OptGroup>,
  <OptGroup label="Cows &amp; Bovines">
    <Option value="6004">Antelope</Option>
    <Option value="6003">Cows</Option>
    <Option value="6005">Gazelle</Option>
    <Option value="6006">Goat</Option>
    <Option value="6007">Bovines (General)</Option>
  </OptGroup>,
  <OptGroup label="Dragons">
    <Option value="4001">Eastern Dragon</Option>
    <Option value="4002">Hydra</Option>
    <Option value="4003">Serpent</Option>
    <Option value="4004">Western Dragon</Option>
    <Option value="4005">Wyvern</Option>
    <Option value="4000">Dragon (Other)</Option>
  </OptGroup>,
  <OptGroup label="Equestrians">
    <Option value="6019">Donkey</Option>
    <Option value="6034">Horse</Option>
    <Option value="6073">Pony</Option>
    <Option value="6071">Zebra</Option>
  </OptGroup>,
  <OptGroup label="Exotic &amp; Mythicals">
    <Option value="5002">Argonian</Option>
    <Option value="5003">Chakat</Option>
    <Option value="5004">Chocobo</Option>
    <Option value="5005">Citra</Option>
    <Option value="5006">Crux</Option>
    <Option value="5007">Daemon</Option>
    <Option value="5008">Digimon</Option>
    <Option value="5009">Dracat</Option>
    <Option value="5010">Draenei</Option>
    <Option value="5011">Elf</Option>
    <Option value="5012">Gargoyle</Option>
    <Option value="5013">Iksar</Option>
    <Option value="5015">Kaiju/Monster</Option>
    <Option value="5014">Langurhali</Option>
    <Option value="5017">Moogle</Option>
    <Option value="5016">Naga</Option>
    <Option value="5018">Orc</Option>
    <Option value="5019">Pokemon</Option>
    <Option value="5020">Satyr</Option>
    <Option value="5021">Sergal</Option>
    <Option value="5022">Tanuki</Option>
    <Option value="5025">Taur (General)</Option>
    <Option value="5023">Unicorn</Option>
    <Option value="5024">Xenomorph</Option>
    <Option value="5001">Alien (Other)</Option>
    <Option value="5000">Exotic (Other)</Option>
  </OptGroup>,
  <OptGroup label="Felines">
    <Option value="6020">Domestic Cat</Option>
    <Option value="6021">Cheetah</Option>
    <Option value="6022">Cougar</Option>
    <Option value="6023">Jaguar</Option>
    <Option value="6024">Leopard</Option>
    <Option value="6025">Lion</Option>
    <Option value="6026">Lynx</Option>
    <Option value="6027">Ocelot</Option>
    <Option value="6028">Panther</Option>
    <Option value="6029">Tiger</Option>
    <Option value="6030">Feline (Other)</Option>
  </OptGroup>,
  <OptGroup label="Insects">
    <Option value="8000">Arachnid</Option>
    <Option value="8004">Mantid</Option>
    <Option value="8005">Scorpion</Option>
    <Option value="8003">Insect (Other)</Option>
  </OptGroup>,
  <OptGroup label="Mammals (Other)">
    <Option value="6001">Bat</Option>
    <Option value="6031">Giraffe</Option>
    <Option value="6032">Hedgehog</Option>
    <Option value="6033">Hippopotamus</Option>
    <Option value="6035">Hyena</Option>
    <Option value="6052">Panda</Option>
    <Option value="6053">Pig/Swine</Option>
    <Option value="6059">Rabbit/Hare</Option>
    <Option value="6060">Raccoon</Option>
    <Option value="6062">Red Panda</Option>
    <Option value="6043">Meerkat</Option>
    <Option value="6044">Mongoose</Option>
    <Option value="6063">Rhinoceros</Option>
    <Option value="6000">Mammals (Other)</Option>
  </OptGroup>,
  <OptGroup label="Marsupials">
    <Option value="6037">Opossum</Option>
    <Option value="6038">Kangaroo</Option>
    <Option value="6039">Koala</Option>
    <Option value="6040">Quoll</Option>
    <Option value="6041">Wallaby</Option>
    <Option value="6042">Marsupial (Other)</Option>
  </OptGroup>,
  <OptGroup label="Mustelids">
    <Option value="6045">Badger</Option>
    <Option value="6046">Ferret</Option>
    <Option value="6048">Mink</Option>
    <Option value="6047">Otter</Option>
    <Option value="6069">Skunk</Option>
    <Option value="6049">Weasel</Option>
    <Option value="6051">Mustelid (Other)</Option>
  </OptGroup>,
  <OptGroup label="Primates">
    <Option value="6054">Gorilla</Option>
    <Option value="6055">Human</Option>
    <Option value="6056">Lemur</Option>
    <Option value="6057">Monkey</Option>
    <Option value="6058">Primate (Other)</Option>
  </OptGroup>,
  <OptGroup label="Reptillian">
    <Option value="7001">Alligator &amp; Crocodile</Option>
    <Option value="7003">Gecko</Option>
    <Option value="7004">Iguana</Option>
    <Option value="7005">Lizard</Option>
    <Option value="7006">Snakes &amp; Serpents</Option>
    <Option value="7007">Turtle</Option>
    <Option value="7000">Reptilian (Other)</Option>
  </OptGroup>,
  <OptGroup label="Rodents">
    <Option value="6064">Beaver</Option>
    <Option value="6065">Mouse</Option>
    <Option value="6061">Rat</Option>
    <Option value="6070">Squirrel</Option>
    <Option value="6067">Rodent (Other)</Option>
  </OptGroup>,
  <OptGroup label="Vulpines">
    <Option value="6072">Fennec</Option>
    <Option value="6075">Fox</Option>
    <Option value="6015">Vulpine (Other)</Option>
  </OptGroup>,
  <OptGroup label="Other">
    <Option value="8001">Dinosaur</Option>
    <Option value="6050">Wolverine</Option>
  </OptGroup>
];
