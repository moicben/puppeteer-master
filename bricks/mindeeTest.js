import mindee from "mindee"
import dotenv from "dotenv";

dotenv.config();

// Init a new client
const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });

// Load a file from disk - remplacez par le chemin vers votre image
const inputSource = mindeeClient.docFromPath("./identities/ornella-galat-front.jpg");

// Parse the file
const apiResponse = mindeeClient.parse(
  mindee.product.fr.IdCardV1,
  inputSource
);

// Handle the response Promise
apiResponse.then((resp) => {
  // print a string summary
  console.log(resp.document.toString());
  
  // Debug pour voir la structure
  console.log("Debug givenNames:", resp.document.inference.prediction.givenNames);
  
  // Optionnel: afficher les données extraites de façon plus détaillée
  console.log("Données extraites:");
  console.log("- Nom:", resp.document.inference.prediction.surname.value);
  
  // Récupérer le premier prénom
  const givenNamesArray = resp.document.inference.prediction.givenNames;
  let firstGivenName = '';
  
  if (givenNamesArray && givenNamesArray.length > 0) {
    firstGivenName = givenNamesArray[0].value;
  }
  
  console.log("- Premier prénom:", firstGivenName);
  
  console.log("- Date de naissance:", resp.document.inference.prediction.birthDate.value);
  console.log("- Lieu de naissance:", resp.document.inference.prediction.birthPlace.value);
}).catch((error) => {
  console.error("Erreur lors de l'analyse:", error);
});