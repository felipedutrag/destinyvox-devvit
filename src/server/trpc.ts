import { router, publicProcedure } from './trpc/init';
import { profileProcedures } from './trpc/routers/profileRouter';
import { oracleProcedures } from './trpc/routers/oracleRouter';
import { synastryProcedures } from './trpc/routers/synastryRouter';
import { socialProcedures } from './trpc/routers/socialRouter';
import { stripeProcedures } from './trpc/routers/stripeRouter';

export { router, publicProcedure };

export const appRouter = router({
  destinyvox: router({
    ...profileProcedures,
    ...oracleProcedures,
    ...synastryProcedures,
    ...socialProcedures,
    ...stripeProcedures,
  }),
});

export type AppRouter = typeof appRouter;
