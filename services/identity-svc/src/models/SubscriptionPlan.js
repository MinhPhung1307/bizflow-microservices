export const SubscriptionPlanModel = `
  CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      plan_name VARCHAR(100),
      max_products INTEGER,
      max_orders INTEGER,
      price DECIMAL(15,2)
  );
`;