// cannister code goes here
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `firStorage` - it's a key-value datastructure that is used to store FIRs.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For the sake of this contract we've chosen {@link StableBTreeMap} as a storage for the next reasons:
 * - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 * - data stored in the map survives canister upgrades unlike using HashMap where data is stored in the heap and it's lost after the canister is upgraded
 *
 * Brakedown of the `StableBTreeMap(string, FIR)` datastructure:
 * - the key of map is a `firId`
 * - the value in this map is a FIR itself `FIR` that is related to a given key (`firId`)
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */

/**
 This type represents a FIR (First Information Report).
 */
class FIR {
   id: string;
   description: string;
   location: string;
   reportedBy: string;
   createdAt: Date;
   updatedAt: Date | null;
}

const firStorage = StableBTreeMap<string, FIR>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   app.post("/firs", (req, res) => {
      const fir: FIR =  {id: uuidv4(), createdAt: getCurrentDate(), ...req.body};
      firStorage.insert(fir.id, fir);
      res.json(fir);
   });

   app.get("/firs", (req, res) => {
      res.json(firStorage.values());
   });

   app.get("/firs/:id", (req, res) => {
      const firId = req.params.id;
      const firOpt = firStorage.get(firId);
      if ("None" in firOpt) {
         res.status(404).send(`the FIR with id=${firId} not found`);
      } else {
         res.json(firOpt.Some);
      }
   });

   app.put("/firs/:id", (req, res) => {
      const firId = req.params.id;
      const firOpt = firStorage.get(firId);
      if ("None" in firOpt) {
         res.status(400).send(`couldn't update a FIR with id=${firId}. FIR not found`);
      } else {
         const fir = firOpt.Some;
         const updatedFIR = { ...fir, ...req.body, updatedAt: getCurrentDate()};
         firStorage.insert(fir.id, updatedFIR);
         res.json(updatedFIR);
      }
   });

   app.delete("/firs/:id", (req, res) => {
      const firId = req.params.id;
      const deletedFIR = firStorage.remove(firId);
      if ("None" in deletedFIR) {
         res.status(400).send(`couldn't delete a FIR with id=${firId}. FIR not found`);
      } else {
         res.json(deletedFIR.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}
