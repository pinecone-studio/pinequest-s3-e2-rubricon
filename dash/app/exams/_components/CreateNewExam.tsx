import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export const CreateNewExam = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#006fee] hover:bg-[#005bc4] text-white flex gap-2">
          <Plus size={18} /> Add Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Шинээр шалгалт үүсгэх
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Шинээр шалгалт үүсгэхдээ доорх мэдээллүүдийг бөглөнө үү.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Exam Name */}
          <Field>
            <Label htmlFor="exam-name">Шалгалтын нэр</Label>
            <Input id="exam-name" placeholder="e.g., Midterm Exam" />
          </Field>

          {/* Course Selection */}
          <Field>
            <Label htmlFor="course">Курс</Label>
            <Select>
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                className="w-[var(--radix-select-trigger-width)] z-[100]"
              >
                <SelectItem value="cs101">CS 101 - Компьютерийн ШУ</SelectItem>
                <SelectItem value="cs301">
                  CS 301 - Өгөгдлийн сангийн систем
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="date">Өдөр</Label>
              <Input id="date" type="date" placeholder="yyyy.mm.dd" />
            </Field>
            <Field>
              <Label htmlFor="time">Цаг</Label>
              <Input id="time" type="time" />
            </Field>
          </div>

          {/* Duration and Number of Questions Row */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="duration">Хугацаа</Label>
              <Select>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={5}
                  className="w-[var(--radix-select-trigger-width)] z-[50]"
                >
                  <SelectItem value="60">1 цаг</SelectItem>
                  <SelectItem value="120">2 цаг</SelectItem>
                  <SelectItem value="180">3 цаг</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="questions">Асуултын тоо</Label>
              <Input id="questions" type="number" placeholder="e.g., 50" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="ghost" className="font-medium">
              Болих
            </Button>
          </DialogClose>
          <Button
            type="submit"
            className="bg-[#006fee] hover:bg-[#005bc4] text-white px-6"
          >
            Шалгалт үүсгэх
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
