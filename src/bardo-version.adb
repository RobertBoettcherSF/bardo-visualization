package body Bardo.Version is

   Stamp : constant String := "v0.12 b20261123-1817 c754d01";

   procedure Copy (Buffer : out String; Length : out Natural) is
   begin
      Buffer := [others => ' '];
      Length := Stamp'Length;
      Buffer (Buffer'First .. Buffer'First + Length - 1) := Stamp;
   end Copy;

end Bardo.Version;
