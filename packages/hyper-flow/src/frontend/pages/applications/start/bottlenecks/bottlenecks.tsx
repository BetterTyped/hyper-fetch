import { CardErrors } from "../general/card-errors";
// import { CardHealth } from "./card-health";
// import { CardNetwork } from "./card-network";
// import { CardProcessing } from "./card-processing";
// import { CardRecommended } from "./card-recommended";

export const Bottlenecks = () => {
  return (
    <div className="space-y-4 mt-4">
      {/* <CardProcessing /> */}
      {/* <CardNetwork /> */}
      <CardErrors />
      {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <CardHealth className="md:col-span-2" />
        <CardRecommended className="md:col-span-3" />
      </div> */}
    </div>
  );
};
