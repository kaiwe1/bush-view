import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function VersionTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>版本数据</CardTitle>
      </CardHeader>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>版本数据功能开发中</p>
        <p className="text-xs mt-1">将展示各版本英雄胜率、装备数据等统计信息</p>
      </CardContent>
    </Card>
  );
}
