with Ada.Text_IO;
with System.Storage_Elements;

package body Host_Stub is

   function Ready return Boolean is (True);

   procedure Trap (File : System.Address; Line : Integer) is
      use System.Storage_Elements;
   begin
      Ada.Text_IO.Put_Line
        ("last chance" & Line'Image & " " & To_Integer (File)'Image);
   end Trap;

end Host_Stub;
