'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCatalogStore } from '@/store/catalog';
import { usePacksStore } from '@/store/packs';
import { QuestionPack, Question, CatalogItem, PackFilters } from '@/lib/types';
import { STATES, MARKETS } from '@/config/constants';
import { ArrowLeft, ArrowRight, Check, Plus, X, AlertCircle } from 'lucide-react';

const steps = [
  { title: 'Pack Details', description: 'Name and basic information' },
  { title: 'Select Trades', description: 'Choose relevant trades/divisions' },
  { title: 'Add Questions', description: 'Select and configure questions' },
  { title: 'User Preferences', description: 'Set state and market filters' },
  { title: 'Review', description: 'Review and save your pack' }
];

interface QuestionConfig {
  catalogItem: CatalogItem;
  type: 'boolean' | 'number' | 'enum' | 'lookup';
  threshold?: number;
  comparator?: '>=' | '<=' | '>' | '<' | '==';
  expectedBoolean?: boolean;
  expectedEnum?: string;
  enumValues?: string[];
  critical: boolean;
  weight: number;
}

export default function NewQuestionPack() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { getAllTrades, getCatalogByTrade } = useCatalogStore();
  const { addPack, loadFromStorage: loadPacks } = usePacksStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [packName, setPackName] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [questionConfigs, setQuestionConfigs] = useState<Map<string, QuestionConfig>>(new Map());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PackFilters>({ states: [], markets: [] });
  const [customQuestion, setCustomQuestion] = useState<QuestionConfig | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPacks();
  }, [loadPacks]);

  const allTrades = mounted ? getAllTrades() : [];

  const isQuestionValid = (config: QuestionConfig): boolean => {
    switch (config.type) {
      case 'boolean':
        return config.expectedBoolean !== undefined;
      case 'number':
        return config.threshold !== undefined && config.comparator !== undefined;
      case 'enum':
        return config.expectedEnum !== undefined && config.enumValues !== undefined && config.enumValues.length > 0;
      case 'lookup':
        return true;
      default:
        return false;
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: return packName.trim().length > 0;
      case 1: return selectedTrades.length > 0;
      case 2: 
        const validQuestions = Array.from(selectedQuestions).filter(id => {
          const config = questionConfigs.get(id);
          return config && isQuestionValid(config);
        });
        return validQuestions.length > 0;
      case 3: return true; // Filters are optional
      default: return true;
    }
  };

  const updateQuestionConfig = (catalogItemId: string, updates: Partial<QuestionConfig>) => {
    setQuestionConfigs(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(catalogItemId);
      if (existing) {
        newMap.set(catalogItemId, { ...existing, ...updates });
      }
      return newMap;
    });
  };

  const toggleQuestion = (catalogItem: CatalogItem) => {
    const isSelected = selectedQuestions.has(catalogItem.id);
    
    if (isSelected) {
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(catalogItem.id);
        return newSet;
      });
      setQuestionConfigs(prev => {
        const newMap = new Map(prev);
        newMap.delete(catalogItem.id);
        return newMap;
      });
    } else {
      setSelectedQuestions(prev => new Set(prev).add(catalogItem.id));
      setQuestionConfigs(prev => {
        const newMap = new Map(prev);
        newMap.set(catalogItem.id, {
          catalogItem,
          type: 'boolean',
          critical: false,
          weight: 5
        });
        return newMap;
      });
    }
  };

  const addCustomQuestion = () => {
    if (!customQuestion || !isQuestionValid(customQuestion)) return;
    
    const customId = `custom-${Date.now()}`;
    const customCatalogItem: CatalogItem = {
      id: customId,
      trade: 'Custom',
      text: customQuestion.catalogItem.text,
      type: customQuestion.type,
      requiresThreshold: customQuestion.type === 'number'
    };
    
    setSelectedQuestions(prev => new Set(prev).add(customId));
    setQuestionConfigs(prev => {
      const newMap = new Map(prev);
      newMap.set(customId, {
        ...customQuestion,
        catalogItem: customCatalogItem
      });
      return newMap;
    });
    
    setCustomQuestion(null);
    setShowCustomDialog(false);
  };

  const addFilterChip = (type: 'states' | 'markets', value: string) => {
    if (!value.trim()) return;
    
    setFilters(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
  };

  const removeFilterChip = (type: 'states' | 'markets', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value)
    }));
  };

  const savePack = () => {
    const questions: Question[] = Array.from(selectedQuestions)
      .map(id => questionConfigs.get(id))
      .filter((config): config is QuestionConfig => config !== undefined && isQuestionValid(config))
      .map(config => ({
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        key: config.catalogItem.id.startsWith('custom-') ? 'custom' : config.catalogItem.id,
        text: config.catalogItem.text,
        type: config.type,
        threshold: config.threshold,
        comparator: config.comparator,
        expectedBoolean: config.expectedBoolean,
        expectedEnum: config.expectedEnum,
        critical: config.critical,
        weight: config.weight
      }));

    const newPack: QuestionPack = {
      id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: packName,
      trades: selectedTrades,
      questions,
      filters,
      createdAt: new Date()
    };
    
    addPack(newPack);
    router.push('/');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create Question Pack
        </h1>
        <p className="text-muted-foreground">
          Build a custom question pack for testing projects
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Step 0: Pack Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="packName">Pack Name *</Label>
                <Input
                  id="packName"
                  placeholder="Enter a name for your question pack"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Select Trades */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the trades/divisions relevant to your question pack:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTrades.map((trade) => (
                  <div
                    key={trade}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTrades.includes(trade)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                    onClick={() => {
                      setSelectedTrades(prev => 
                        prev.includes(trade)
                          ? prev.filter(t => t !== trade)
                          : [...prev, trade]
                      );
                    }}
                  >
                    <p className="font-medium text-sm">{trade}</p>
                    <p className="text-xs text-muted-foreground">
                      {mounted ? getCatalogByTrade(trade).length : 0} questions
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Question Picker UI */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configure Questions</h3>
                <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Custom Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Question Text *</Label>
                        <Input
                          placeholder="Enter your custom question"
                          value={customQuestion?.catalogItem.text || ''}
                          onChange={(e) => setCustomQuestion(prev => ({
                            ...prev,
                            catalogItem: {
                              id: 'temp',
                              trade: 'Custom',
                              text: e.target.value,
                              type: prev?.type || 'boolean',
                              requiresThreshold: prev?.type === 'number'
                            },
                            type: prev?.type || 'boolean',
                            critical: prev?.critical || false,
                            weight: prev?.weight || 5
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Question Type *</Label>
                        <Select
                          value={customQuestion?.type || 'boolean'}
                          onValueChange={(value: 'boolean' | 'number' | 'enum' | 'lookup') => 
                            setCustomQuestion(prev => ({
                              ...prev,
                              catalogItem: {
                                id: 'temp',
                                trade: 'Custom',
                                text: prev?.catalogItem.text || '',
                                type: value,
                                requiresThreshold: value === 'number'
                              },
                              type: value,
                              critical: prev?.critical || false,
                              weight: prev?.weight || 5
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="enum">Enum (Multiple Choice)</SelectItem>
                            <SelectItem value="lookup">Lookup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type-specific inputs for custom question */}
                      {customQuestion?.type === 'boolean' && (
                        <div>
                          <Label>Expected Answer *</Label>
                          <Select
                            value={customQuestion.expectedBoolean?.toString()}
                            onValueChange={(value) => setCustomQuestion(prev => ({
                              ...prev!,
                              expectedBoolean: value === 'true'
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {customQuestion?.type === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Comparator *</Label>
                            <Select
                              value={customQuestion.comparator}
                              onValueChange={(value: '>=' | '<=' | '>' | '<' | '==') => 
                                setCustomQuestion(prev => ({ ...prev!, comparator: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select comparator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value=">=">&gt;=</SelectItem>
                                <SelectItem value="<=">&lt;=</SelectItem>
                                <SelectItem value=">">&gt;</SelectItem>
                                <SelectItem value="<">&lt;</SelectItem>
                                <SelectItem value="==">=</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Threshold *</Label>
                            <Input
                              type="number"
                              placeholder="Enter threshold"
                              value={customQuestion.threshold || ''}
                              onChange={(e) => setCustomQuestion(prev => ({
                                ...prev!,
                                threshold: parseFloat(e.target.value) || undefined
                              }))}
                            />
                          </div>
                        </div>
                      )}

                      {customQuestion?.type === 'enum' && (
                        <div className="space-y-2">
                          <div>
                            <Label>Allowed Values (comma-separated) *</Label>
                            <Input
                              placeholder="Option 1, Option 2, Option 3"
                              onChange={(e) => {
                                const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                setCustomQuestion(prev => ({ ...prev!, enumValues: values }));
                              }}
                            />
                          </div>
                          {customQuestion.enumValues && customQuestion.enumValues.length > 0 && (
                            <div>
                              <Label>Expected Value *</Label>
                              <Select
                                value={customQuestion.expectedEnum}
                                onValueChange={(value) => setCustomQuestion(prev => ({
                                  ...prev!,
                                  expectedEnum: value
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select expected value" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customQuestion.enumValues.map(value => (
                                    <SelectItem key={value} value={value}>{value}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="customCritical"
                          checked={customQuestion?.critical || false}
                          onCheckedChange={(checked) => setCustomQuestion(prev => ({
                            ...prev!,
                            critical: checked as boolean
                          }))}
                        />
                        <Label htmlFor="customCritical">Critical Question</Label>
                      </div>

                      <div>
                        <Label>Weight: {customQuestion?.weight || 5}</Label>
                        <Slider
                          value={[customQuestion?.weight || 5]}
                          onValueChange={([value]) => setCustomQuestion(prev => ({
                            ...prev!,
                            weight: value
                          }))}
                          max={10}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addCustomQuestion}
                          disabled={!customQuestion || !isQuestionValid(customQuestion)}
                        >
                          Add Question
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Catalog Questions Table */}
              {selectedTrades.map((trade) => {
                const tradeQuestions = mounted ? getCatalogByTrade(trade) : [];
                return (
                  <Card key={trade}>
                    <CardHeader>
                      <CardTitle className="text-lg">{trade}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {tradeQuestions.map((catalogItem) => {
                          const isSelected = selectedQuestions.has(catalogItem.id);
                          const config = questionConfigs.get(catalogItem.id);
                          const isValid = config ? isQuestionValid(config) : false;
                          
                          return (
                            <div key={catalogItem.id} className="border rounded-lg p-4 space-y-4">
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleQuestion(catalogItem)}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{catalogItem.text}</p>
                                  {isSelected && !isValid && (
                                    <div className="flex items-center text-amber-600 text-sm mt-1">
                                      <AlertCircle className="w-4 h-4 mr-1" />
                                      Please configure all required fields
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isSelected && config && (
                                <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                                  <div>
                                    <Label>Question Type</Label>
                                    <Select
                                      value={config.type}
                                      onValueChange={(value: 'boolean' | 'number' | 'enum' | 'lookup') => 
                                        updateQuestionConfig(catalogItem.id, { type: value })
                                      }
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="enum">Enum (Multiple Choice)</SelectItem>
                                        <SelectItem value="lookup">Lookup</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Type-specific configuration */}
                                  {config.type === 'boolean' && (
                                    <div>
                                      <Label>Expected Answer *</Label>
                                      <Select
                                        value={config.expectedBoolean?.toString()}
                                        onValueChange={(value) => updateQuestionConfig(catalogItem.id, {
                                          expectedBoolean: value === 'true'
                                        })}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">Yes</SelectItem>
                                          <SelectItem value="false">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {config.type === 'number' && (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Comparator *</Label>
                                        <Select
                                          value={config.comparator}
                                          onValueChange={(value: '>=' | '<=' | '>' | '<' | '==') => 
                                            updateQuestionConfig(catalogItem.id, { comparator: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value=">=">&gt;=</SelectItem>
                                            <SelectItem value="<=">&lt;=</SelectItem>
                                            <SelectItem value=">">&gt;</SelectItem>
                                            <SelectItem value="<">&lt;</SelectItem>
                                            <SelectItem value="==">=</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Threshold *</Label>
                                        <Input
                                          type="number"
                                          placeholder="Enter threshold"
                                          value={config.threshold || ''}
                                          onChange={(e) => updateQuestionConfig(catalogItem.id, {
                                            threshold: parseFloat(e.target.value) || undefined
                                          })}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {config.type === 'enum' && (
                                    <div className="space-y-2">
                                      <div>
                                        <Label>Allowed Values (comma-separated) *</Label>
                                        <Input
                                          placeholder="Option 1, Option 2, Option 3"
                                          onChange={(e) => {
                                            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                            updateQuestionConfig(catalogItem.id, { enumValues: values });
                                          }}
                                        />
                                      </div>
                                      {config.enumValues && config.enumValues.length > 0 && (
                                        <div>
                                          <Label>Expected Value *</Label>
                                          <Select
                                            value={config.expectedEnum}
                                            onValueChange={(value) => updateQuestionConfig(catalogItem.id, {
                                              expectedEnum: value
                                            })}
                                          >
                                            <SelectTrigger className="w-48">
                                              <SelectValue placeholder="Select expected" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {config.enumValues.map(value => (
                                                <SelectItem key={value} value={value}>{value}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`critical-${catalogItem.id}`}
                                        checked={config.critical}
                                        onCheckedChange={(checked) => updateQuestionConfig(catalogItem.id, {
                                          critical: checked as boolean
                                        })}
                                      />
                                      <Label htmlFor={`critical-${catalogItem.id}`}>Critical Question</Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Label>Weight: {config.weight}</Label>
                                      <div className="w-24">
                                        <Slider
                                          value={[config.weight]}
                                          onValueChange={([value]) => updateQuestionConfig(catalogItem.id, {
                                            weight: value
                                          })}
                                          max={10}
                                          min={0}
                                          step={1}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Custom Questions */}
              {Array.from(selectedQuestions).filter(id => id.startsWith('custom-')).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from(selectedQuestions)
                        .filter(id => id.startsWith('custom-'))
                        .map(id => {
                          const config = questionConfigs.get(id);
                          if (!config) return null;
                          
                          return (
                            <div key={id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">{config.catalogItem.text}</p>
                                <p className="text-sm text-muted-foreground">
                                  Type: {config.type} | Weight: {config.weight} | 
                                  {config.critical && ' Critical'}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuestions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(id);
                                    return newSet;
                                  });
                                  setQuestionConfigs(prev => {
                                    const newMap = new Map(prev);
                                    newMap.delete(id);
                                    return newMap;
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: User Preferences (Filters) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">User Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>States</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {filters.states.map(state => (
                      <Badge key={state} variant="secondary" className="flex items-center gap-1">
                        {state}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeFilterChip('states', state)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addFilterChip('states', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add state filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.filter(state => !filters.states.includes(state)).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Markets</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {filters.markets.map(market => (
                      <Badge key={market} variant="secondary" className="flex items-center gap-1">
                        {market}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeFilterChip('markets', market)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(value) => addFilterChip('markets', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add market filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.filter(market => !filters.markets.includes(market)).map(market => (
                        <SelectItem key={market} value={market}>{market}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Add Custom State</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter custom state"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addFilterChip('states', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add Custom Market</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter custom market"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addFilterChip('markets', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Question Pack</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Pack Name</Label>
                    <p>{packName}</p>
                  </div>
                  
                  <div>
                    <Label className="font-medium">Selected Trades</Label>
                    <p>{selectedTrades.join(', ')}</p>
                  </div>
                  
                  <div>
                    <Label className="font-medium">Questions</Label>
                    <p>{Array.from(selectedQuestions).filter(id => {
                      const config = questionConfigs.get(id);
                      return config && isQuestionValid(config);
                    }).length} configured questions</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">State Filters</Label>
                    <p>{filters.states.length > 0 ? filters.states.join(', ') : 'None'}</p>
                  </div>
                  
                  <div>
                    <Label className="font-medium">Market Filters</Label>
                    <p>{filters.markets.length > 0 ? filters.markets.join(', ') : 'None'}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-medium">Question Summary</Label>
                <div className="mt-2 space-y-2">
                  {Array.from(selectedQuestions)
                    .map(id => questionConfigs.get(id))
                    .filter((config): config is QuestionConfig => config !== undefined && isQuestionValid(config))
                    .map((config, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{config.catalogItem.text}</p>
                            <p className="text-sm text-muted-foreground">
                              Type: {config.type} | Weight: {config.weight}
                              {config.critical && ' | Critical'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button 
            onClick={nextStep}
            disabled={!canProceedFromStep(currentStep)}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={savePack}
            disabled={!canProceedFromStep(currentStep)}
          >
            <Check className="mr-2 h-4 w-4" />
            Create Pack
          </Button>
        )}
      </div>
    </div>
  );
} 