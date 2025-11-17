import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabelPurchases from "./LabelPurchases";
import LabelAvailability from "./LabelAvailability";
import LabelPayments from "./LabelPayments";

const Labels = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Labels Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage label availability, purchases, and payments
        </p>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="availability">Labels Availability</TabsTrigger>
          <TabsTrigger value="purchases">Labels Purchase</TabsTrigger>
          <TabsTrigger value="payments">Labels Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="availability" className="space-y-4">
          <LabelAvailability />
        </TabsContent>
        
        <TabsContent value="purchases" className="space-y-4">
          <LabelPurchases />
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <LabelPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Labels;
