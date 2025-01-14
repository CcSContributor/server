import { npcAction } from '@server/world/action/npc-action';
import { findShop } from '@server/config';


const tradeAction: npcAction = ({ player }) =>
    findShop('rs:louies_armored_legs')?.open(player);

export default {
    type: 'npc_action',
    npcs: 'rs:alkharid_louie',
    options: 'trade',
    walkTo: true,
    action: tradeAction
};
