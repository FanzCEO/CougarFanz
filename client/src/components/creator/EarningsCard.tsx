import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Users, Heart, ArrowUpIcon, ArrowDownIcon } from "lucide-react";

export default function EarningsCard() {
  const [period, setPeriod] = useState("month");

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['/api/analytics/earnings', period],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const periodLabels = {
    day: "Today",
    week: "This Week", 
    month: "This Month"
  };

  return (
    <Card className="pack-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Earnings Overview
          </CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32" data-testid="select-earnings-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-20" />
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total Earnings */}
            <div className="text-center p-6 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted mb-2">{periodLabels[period as keyof typeof periodLabels]} Earnings</p>
              <p className="text-4xl font-bold text-primary mb-2" data-testid="text-total-earnings">
                {formatCurrency(earnings?.totalEarnings || 0)}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <ArrowUpIcon className="h-4 w-4 text-success" />
                <span className="text-success">+15.3% from last {period}</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  <span className="text-xs text-muted">Subscriptions</span>
                </div>
                <p className="text-2xl font-bold text-secondary" data-testid="text-subscription-earnings">
                  {formatCurrency(earnings?.subscriptionEarnings || 0)}
                </p>
                <div className="flex items-center space-x-1 text-xs text-muted mt-1">
                  <ArrowUpIcon className="h-3 w-3 text-success" />
                  <span>+8.2%</span>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-5 w-5 text-accent" />
                  <span className="text-xs text-muted">Tips</span>
                </div>
                <p className="text-2xl font-bold text-accent" data-testid="text-tip-earnings">
                  {formatCurrency(earnings?.tipEarnings || 0)}
                </p>
                <div className="flex items-center space-x-1 text-xs text-muted mt-1">
                  <ArrowUpIcon className="h-3 w-3 text-success" />
                  <span>+23.1%</span>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-success" />
                  <span className="text-xs text-muted">PPV Content</span>
                </div>
                <p className="text-2xl font-bold text-success" data-testid="text-ppv-earnings">
                  {formatCurrency(earnings?.ppvEarnings || 0)}
                </p>
                <div className="flex items-center space-x-1 text-xs text-muted mt-1">
                  <ArrowDownIcon className="h-3 w-3 text-destructive" />
                  <span>-2.1%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" data-testid="button-view-analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Detailed Analytics
              </Button>
              <Button variant="outline" className="flex-1" data-testid="button-payout-settings">
                <DollarSign className="mr-2 h-4 w-4" />
                Payout Settings
              </Button>
            </div>

            {/* Earnings History Chart Placeholder */}
            <div className="h-32 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-lg flex items-center justify-center border border-border">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">Earnings chart coming soon</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
